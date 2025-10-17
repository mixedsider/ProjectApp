import { useMemo, useState } from 'react'

const initialInventory = [
  { id: 'americano-ice', name: '아메리카노(ICE)', stock: 10 },
  { id: 'americano-hot', name: '아메리카노(HOT)', stock: 10 },
  { id: 'caffe-latte', name: '카페라떼', stock: 10 },
]

const initialOrders = [
  { id: 'o-1', createdAt: new Date(), items: [{ name: '아메리카노(ICE)', qty: 1 }], amount: 4000, status: 'PLACED' },
]

function statusBadge(stock){
  if(stock <= 0) return { label: '품절', color: '#ef4444' }
  if(stock < 5) return { label: '주의', color: '#f59e0b' }
  return { label: '정상', color: '#10b981' }
}

export default function AdminPage(){
  const [inventory, setInventory] = useState(initialInventory)
  const [orders, setOrders] = useState(initialOrders)

  const stats = useMemo(()=>{
    return {
      total: orders.length,
      placed: orders.filter(o=>o.status==='PLACED').length,
      inProgress: orders.filter(o=>o.status==='IN_PROGRESS').length,
      done: orders.filter(o=>o.status==='DONE').length,
    }
  }, [orders])

  const changeStock = (id, delta)=>{
    setInventory(prev=> prev.map(i=> i.id===id ? { ...i, stock: Math.max(0, Math.min(999, i.stock + delta)) } : i))
  }

  const acceptOrder = (id)=>{
    setOrders(prev=> prev.map(o=> o.id===id && o.status==='PLACED' ? { ...o, status:'ACCEPTED' } : o))
  }
  const startMake = (id)=>{
    setOrders(prev=> prev.map(o=> o.id===id && (o.status==='PLACED' || o.status==='ACCEPTED') ? { ...o, status:'IN_PROGRESS' } : o))
  }
  const finishOrder = (id)=>{
    setOrders(prev=> prev.map(o=> o.id===id && o.status==='IN_PROGRESS' ? { ...o, status:'DONE' } : o))
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
            const badge = statusBadge(item.stock)
            return (
              <div key={item.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:16,display:'flex',flexDirection:'column',gap:8}}>
                <div style={{fontWeight:700}}>{item.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span>재고 {item.stock}개</span>
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
                {new Intl.DateTimeFormat('ko-KR', { dateStyle:'medium', timeStyle:'short' }).format(o.createdAt)}
              </div>
              <div>
                {o.items.map((i,idx)=>(
                  <div key={idx}>{i.name} x {i.qty}</div>
                ))}
              </div>
              <div style={{fontWeight:700,textAlign:'right'}}>{new Intl.NumberFormat('ko-KR').format(o.amount)}원</div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                {o.status==='PLACED' && (
                  <button className="btn" onClick={()=>acceptOrder(o.id)}>주문 접수</button>
                )}
                {(o.status==='PLACED' || o.status==='ACCEPTED') && (
                  <button className="btn" onClick={()=>startMake(o.id)}>제조 시작</button>
                )}
                {o.status==='IN_PROGRESS' && (
                  <button className="btn" onClick={()=>finishOrder(o.id)}>제조 완료</button>
                )}
                {o.status==='DONE' && (
                  <span style={{color:'#6b7280'}}>완료</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


