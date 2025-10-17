import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import prisma from './db.js'

// 데이터베이스 초기화 함수
async function initializeDatabase() {
  try {
    console.log('🔍 데이터베이스 초기화 확인 중...')
    
    // 메뉴가 이미 있는지 확인
    const existingMenus = await prisma.menu.findMany()
    
    if (existingMenus.length > 0) {
      console.log('✅ 데이터베이스가 이미 초기화되어 있습니다.')
      return
    }
    
    console.log('🌱 데이터베이스 초기화 시작...')
    
    // 메뉴 데이터 생성
    const americanoIce = await prisma.menu.create({
      data: {
        name: '아메리카노(ICE)',
        description: '깔끔한 산미와 청량감',
        price: 4000,
        imageUrl: '/img/americano-ice.jpg',
        stockQty: 10,
      },
    })

    const americanoHot = await prisma.menu.create({
      data: {
        name: '아메리카노(HOT)',
        description: '균형 잡힌 바디감',
        price: 4000,
        imageUrl: '/img/americano-hot.jpg',
        stockQty: 10,
      },
    })

    const caffeLatte = await prisma.menu.create({
      data: {
        name: '카페라떼',
        description: '부드러운 우유 거품',
        price: 5000,
        imageUrl: '/img/caffe-latte.jpg',
        stockQty: 10,
      },
    })

    // 옵션 데이터 생성
    await prisma.option.createMany({
      data: [
        { menuId: americanoIce.id, name: 'shot', priceDelta: 500 },
        { menuId: americanoIce.id, name: 'syrup', priceDelta: 0 },
        { menuId: americanoHot.id, name: 'shot', priceDelta: 500 },
        { menuId: americanoHot.id, name: 'syrup', priceDelta: 0 },
        { menuId: caffeLatte.id, name: 'shot', priceDelta: 500 },
        { menuId: caffeLatte.id, name: 'syrup', priceDelta: 0 },
      ],
    })

    console.log('✅ 데이터베이스 초기화 완료!')
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error)
    // 초기화 실패해도 서버는 계속 실행
  }
}

// .env 파일 로드
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// 데이터베이스 초기화 API (개발/배포용)
app.post('/api/init-db', async (req, res) => {
  try {
    await initializeDatabase()
    res.json({ success: true, message: '데이터베이스 초기화 완료' })
  } catch (error) {
    console.error('API 초기화 실패:', error)
    res.status(500).json({ error: '초기화 실패', message: error.message })
  }
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
    console.log('=== 주문 요청 시작 ===')
    console.log('요청 데이터:', JSON.stringify(req.body, null, 2))
    
    const { items } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      console.log('❌ 잘못된 아이템 데이터:', items)
      return res.status(400).json({ error: 'INVALID_ITEMS' })
    }
    
    console.log('✅ 아이템 검증 통과, 아이템 수:', items.length)

    // 트랜잭션으로 주문 생성 및 재고 차감
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const orderItems = []

      // 각 메뉴별 재고 확인 및 차감
      for (const item of items) {
        console.log(`🔍 메뉴 처리 중: ID=${item.menuId}, 수량=${item.quantity}, 옵션=${item.optionIds}`)
        
        const menu = await tx.menu.findUnique({
          where: { id: item.menuId },
        })
        
        if (!menu) {
          console.log(`❌ 메뉴를 찾을 수 없음: ${item.menuId}`)
          throw new Error(`메뉴를 찾을 수 없습니다: ${item.menuId}`)
        }
        
        console.log(`✅ 메뉴 찾음: ${menu.name}, 현재 재고: ${menu.stockQty}`)
        
        if (menu.stockQty < item.quantity) {
          console.log(`❌ 재고 부족: 필요=${item.quantity}, 보유=${menu.stockQty}`)
          throw new Error(`재고가 부족합니다: ${menu.name}`)
        }

        // 재고 차감
        await tx.menu.update({
          where: { id: item.menuId },
          data: { stockQty: { decrement: item.quantity } },
        })

        // 옵션 가격 계산
        let optionTotal = 0
        const selectedOptions = []
        if (item.optionIds && item.optionIds.length > 0) {
          console.log(`💰 옵션 처리 중: ${item.optionIds}`)
          
          // 옵션 정보를 데이터베이스에서 조회
          const options = await tx.option.findMany({
            where: {
              menuId: item.menuId,
              name: {
                in: item.optionIds
              }
            }
          })
          
          console.log(`🔍 찾은 옵션들:`, options)
          
          optionTotal = options.reduce((sum, opt) => {
            console.log(`  - 옵션 ${opt.name}: +${opt.priceDelta}원`)
            selectedOptions.push(opt)
            return sum + opt.priceDelta
          }, 0)
          console.log(`💰 옵션 총 가격: ${optionTotal}원`)
        }

        const unitPrice = menu.price + optionTotal
        const lineTotal = unitPrice * item.quantity
        totalAmount += lineTotal

        console.log(`💰 가격 계산: 메뉴=${menu.price}원 + 옵션=${optionTotal}원 = 단가=${unitPrice}원, 총액=${lineTotal}원`)

        orderItems.push({
          menuId: item.menuId,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        })
      }

      // 주문 생성
      console.log(`📝 주문 생성 중, 총 금액: ${totalAmount}원`)
      const order = await tx.order.create({
        data: {
          totalAmount,
          status: 'PLACED',
        },
      })
      console.log(`✅ 주문 생성 완료, 주문 ID: ${order.id}`)

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
          // 해당 메뉴의 옵션들을 다시 조회하여 정수 ID 사용
          const options = await tx.option.findMany({
            where: {
              menuId: item.menuId,
              name: {
                in: originalItem.optionIds
              }
            }
          })
          
          for (const option of options) {
            await tx.orderItemOption.create({
              data: {
                orderItemId: orderItem.id,
                optionId: option.id, // 데이터베이스의 정수 ID 사용
                priceDelta: option.priceDelta,
              },
            })
          }
        }
      }

      return order
    })

    console.log(`🎉 주문 성공! 주문 ID: ${result.id}, 총 금액: ${result.totalAmount}원`)
    res.status(201).json({
      orderId: result.id,
      totalAmount: result.totalAmount,
      status: result.status,
    })
  } catch (error) {
    console.error('❌ 주문 생성 실패!')
    console.error('에러 메시지:', error.message)
    console.error('에러 스택:', error.stack)
    console.error('요청 데이터:', JSON.stringify(req.body, null, 2))
    
    if (error.message.includes('재고가 부족') || error.message.includes('메뉴를 찾을 수 없습니다')) {
      console.error('❌ 재고/메뉴 관련 에러')
      return res.status(409).json({ error: 'CONFLICT', message: error.message })
    }
    
    console.error('❌ 서버 내부 에러')
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message })
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

app.listen(PORT, async () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  
  // 데이터베이스 초기화 실행
  await initializeDatabase()
})


