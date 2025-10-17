import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import prisma from './db.js'

// .env 파일 로드
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// 메뉴 조회
app.get('/api/menus', async (req, res) => {
  try {
    const includeStock = req.query.includeStock === 'true'
    const menus = await prisma.menu.findMany({
      include: {
        options: true,
      },
    })
    
    if (!includeStock) {
      return res.json(menus.map(({ stockQty, ...rest }) => rest))
    }
    res.json(menus)
  } catch (error) {
    console.error('메뉴 조회 오류:', error)
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// 주문 생성
app.post('/api/orders', async (req, res) => {
  try {
    const { items } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'INVALID_ITEMS' })
    }

    // 트랜잭션으로 주문 생성 및 재고 차감
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const orderItems = []

      // 각 메뉴별 재고 확인 및 차감
      for (const item of items) {
        const menu = await tx.menu.findUnique({
          where: { id: item.menuId },
        })
        
        if (!menu) {
          throw new Error(`메뉴를 찾을 수 없습니다: ${item.menuId}`)
        }
        
        if (menu.stockQty < item.quantity) {
          throw new Error(`재고가 부족합니다: ${menu.name}`)
        }

        // 재고 차감
        await tx.menu.update({
          where: { id: item.menuId },
          data: { stockQty: { decrement: item.quantity } },
        })

        // 옵션 가격 계산
        let optionTotal = 0
        if (item.optionIds && item.optionIds.length > 0) {
          const options = await tx.option.findMany({
            where: { id: { in: item.optionIds } },
          })
          optionTotal = options.reduce((sum, opt) => sum + opt.priceDelta, 0)
        }

        const unitPrice = menu.price + optionTotal
        const lineTotal = unitPrice * item.quantity
        totalAmount += lineTotal

        orderItems.push({
          menuId: item.menuId,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        })
      }

      // 주문 생성
      const order = await tx.order.create({
        data: {
          totalAmount,
          status: 'PLACED',
        },
      })

      // 주문 항목 생성
      for (const item of orderItems) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            ...item,
          },
        })

        // 옵션 연결 (해당하는 경우)
        const originalItem = items.find(i => i.menuId === item.menuId)
        if (originalItem.optionIds && originalItem.optionIds.length > 0) {
          const options = await tx.option.findMany({
            where: { id: { in: originalItem.optionIds } },
          })
          
          for (const option of options) {
            await tx.orderItemOption.create({
              data: {
                orderItemId: orderItem.id,
                optionId: option.id,
                priceDelta: option.priceDelta,
              },
            })
          }
        }
      }

      return order
    })

    res.status(201).json({
      orderId: result.id,
      totalAmount: result.totalAmount,
      status: result.status,
    })
  } catch (error) {
    console.error('주문 생성 오류:', error)
    if (error.message.includes('재고가 부족') || error.message.includes('메뉴를 찾을 수 없습니다')) {
      return res.status(409).json({ error: 'CONFLICT', message: error.message })
    }
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// 주문 조회
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            menu: true,
            options: {
              include: {
                option: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND' })
    }

    res.json(order)
  } catch (error) {
    console.error('주문 조회 오류:', error)
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// 주문 목록 조회 (관리자용)
app.get('/api/orders', async (req, res) => {
  try {
    const { status, limit = 20, cursor } = req.query
    const where = status ? { status } : {}
    const take = parseInt(limit)
    
    const orders = await prisma.order.findMany({
      where,
      take,
      skip: cursor ? parseInt(cursor) : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
    })

    res.json({ items: orders, nextCursor: orders.length === take ? orders[orders.length - 1].id : null })
  } catch (error) {
    console.error('주문 목록 조회 오류:', error)
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// 주문 상태 변경
app.patch('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params
    const { status } = req.body

    const validStatuses = ['ACCEPTED', 'IN_PROGRESS', 'DONE']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'INVALID_STATUS' })
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    })

    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND' })
    }

    // 상태 전환 규칙 검증
    const validTransitions = {
      'PLACED': ['ACCEPTED'],
      'ACCEPTED': ['IN_PROGRESS'],
      'IN_PROGRESS': ['DONE'],
    }

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(409).json({ error: 'INVALID_TRANSITION' })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status },
    })

    res.json(updatedOrder)
  } catch (error) {
    console.error('주문 상태 변경 오류:', error)
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// 재고 조정 (관리자용)
app.patch('/api/menus/:menuId/stock', async (req, res) => {
  try {
    const { menuId } = req.params
    const { delta } = req.body

    if (typeof delta !== 'number') {
      return res.status(400).json({ error: 'INVALID_DELTA' })
    }

    const menu = await prisma.menu.findUnique({
      where: { id: parseInt(menuId) },
    })

    if (!menu) {
      return res.status(404).json({ error: 'NOT_FOUND' })
    }

    const newStock = Math.max(0, Math.min(999, menu.stockQty + delta))
    
    const updatedMenu = await prisma.menu.update({
      where: { id: parseInt(menuId) },
      data: { stockQty: newStock },
    })

    res.json({ menuId: updatedMenu.id, stockQty: updatedMenu.stockQty })
  } catch (error) {
    console.error('재고 조정 오류:', error)
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})


