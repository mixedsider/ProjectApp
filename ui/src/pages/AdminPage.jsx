import { useMemo, useState, useEffect } from 'react'
import api from '../services/api.js'

function statusBadge(stock){
  if(stock <= 0) return { label: '품절', color: '#ef4444' }
  if(stock < 5) return { label: '주의', color: '#f59e0b' }
  return { label: '정상', color: '#10b981' }
}

export default function AdminPage(){
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [menuData, orderData] = await Promise.all([
        api.getMenus(true), // 재고 포함
        api.getOrders()
      ])
      setInventory(menuData)
      setOrders(orderData.items || [])
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(()=>{
    return {
      total: orders.length,
      placed: orders.filter(o=>o.status==='PLACED').length,
      inProgress: orders.filter(o=>o.status==='IN_PROGRESS').length,
      done: orders.filter(o=>o.status==='DONE').length,
    }
  }, [orders])

  const changeStock = async (id, delta) => {
    try {
      const result = await api.updateMenuStock(id, delta)
      setInventory(prev => prev.map(i => 
        i.id === id ? { ...i, stockQty: result.stockQty } : i
      ))
    } catch (error) {
      console.error('재고 업데이트 실패:', error)
      alert('재고 업데이트에 실패했습니다.')
    }
  }

  const acceptOrder = async (id) => {
    try {
      await api.updateOrderStatus(id, 'ACCEPTED')
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ACCEPTED' } : o))
    } catch (error) {
      console.error('주문 접수 실패:', error)
      alert('주문 접수에 실패했습니다.')
    }
  }

  const startMake = async (id) => {
    try {
      await api.updateOrderStatus(id, 'IN_PROGRESS')
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'IN_PROGRESS' } : o))
    } catch (error) {
      console.error('제조 시작 실패:', error)
      alert('제조 시작에 실패했습니다.')
    }
  }

  const finishOrder = async (id) => {
    try {
      await api.updateOrderStatus(id, 'DONE')
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'DONE' } : o))
    } catch (error) {
      console.error('제조 완료 실패:', error)
      alert('제조 완료 처리에 실패했습니다.')
    }
  }

  const cancelOrder = async (id) => {
    if (!confirm('정말로 이 주문을 취소하시겠습니까?')) {
      return
    }
    
    try {
      await api.cancelOrder(id)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o))
      alert('주문이 취소되었습니다.')
    } catch (error) {
      console.error('주문 취소 실패:', error)
      alert('주문 취소에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="page" style={{display:'flex',flexDirection:'column',gap:20, textAlign:'center', padding:'40px'}}>
        <div>데이터를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="page" style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* 관리자 대시보드 */}
      <section>
        <h2 style={{margin:'8px 0'}}>관리자 대시보드</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            { label:'총 주문', value:stats.total },
            { label:'주문 접수', value:stats.placed },
            { label:'제조 중', value:stats.inProgress },
            { label:'제조 완료', value:stats.done },
          ].map(card=> (
            <div key={card.label} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:16}}>
              <div style={{color:'#6b7280',fontSize:14}}>{card.label}</div>
              <div style={{fontWeight:800,fontSize:24}}>{card.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 재고 현황 */}
      <section>
        <h2 style={{margin:'8px 0'}}>재고 현황</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {inventory.map(item=>{
            const badge = statusBadge(item.stockQty)
            return (
              <div key={item.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:16,display:'flex',flexDirection:'column',gap:8}}>
                <div style={{fontWeight:700}}>{item.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span>재고 {item.stockQty}개</span>
                  <span style={{color:badge.color,fontWeight:700}}>{badge.label}</span>
                  <div style={{display:'flex',gap:8, marginLeft:'auto'}}>
                    <button className="btn btn-icon" aria-label="increase" onClick={()=>changeStock(item.id, +1)}>+</button>
                    <button className="btn btn-icon" aria-label="decrease" onClick={()=>changeStock(item.id, -1)}>-</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 주문 현황 */}
      <section>
        <h2 style={{margin:'8px 0'}}>주문 현황</h2>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12}}>
          {orders.map(o=> (
            <div key={o.id} style={{display:'grid',gridTemplateColumns:'220px 1fr 120px 260px',gap:12,alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #e5e7eb'}}>
              <div style={{color:'#6b7280'}}>
                {new Intl.DateTimeFormat('ko-KR', { dateStyle:'medium', timeStyle:'short' }).format(new Date(o.createdAt))}
              </div>
              <div>
                {o.items.map((i,idx)=>(
                  <div key={idx}>{i.menu?.name || '메뉴명 없음'} x {i.quantity}</div>
                ))}
              </div>
              <div style={{fontWeight:700,textAlign:'right'}}>{new Intl.NumberFormat('ko-KR').format(o.totalAmount || 0)}원</div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                {o.status==='PLACED' && (
                  <button className="btn" onClick={()=>acceptOrder(o.id)}>주문 접수</button>
                )}
                {o.status==='ACCEPTED' && (
                  <>
                    <button className="btn" onClick={()=>startMake(o.id)}>제조 시작</button>
                    <button className="btn" onClick={()=>cancelOrder(o.id)} style={{background:'#ef4444'}}>주문 취소</button>
                  </>
                )}
                {o.status==='IN_PROGRESS' && (
                  <button className="btn" onClick={()=>finishOrder(o.id)}>제조 완료</button>
                )}
                {o.status==='DONE' && (
                  <span style={{color:'#6b7280'}}>완료</span>
                )}
                {o.status==='CANCELLED' && (
                  <span style={{color:'#ef4444'}}>취소</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


