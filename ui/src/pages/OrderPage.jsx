import { useMemo, useState, useEffect } from 'react'
import api from '../services/api.js'

const options = [
  { id: 'shot', name: '샷 추가', priceDelta: 500 },
  { id: 'syrup', name: '시럽 추가', priceDelta: 0 },
]

function formatCurrency(n){
  return new Intl.NumberFormat('ko-KR').format(n) + '원'
}

function MenuCard({ item, onAdd }){
  const [selected, setSelected] = useState([])
  const toggle = (id)=>{
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }
  
  const isOutOfStock = item.stockQty <= 0
  
  return (
    <div className="card" style={{opacity: isOutOfStock ? 0.6 : 1}}>
      <div className="thumb" style={{backgroundImage:`url(${item.imageUrl})`,backgroundSize:'cover',backgroundPosition:'center'}} />
      <div className="title">{item.name}</div>
      <div className="price">{formatCurrency(item.price)}</div>
      {isOutOfStock && (
        <div style={{color:'#ef4444',fontWeight:700,fontSize:14,margin:'8px 0'}}>
          품절
        </div>
      )}
      <div className="options">
        {options.map(opt=>{
          const checked = selected.includes(opt.id)
          return (
            <label key={opt.id} style={{display:'flex',alignItems:'center',gap:8,opacity: isOutOfStock ? 0.5 : 1}}>
              <input type="checkbox" checked={checked} onChange={()=>toggle(opt.id)} disabled={isOutOfStock} />
              <span>{opt.name} ({opt.priceDelta>0?`+${formatCurrency(opt.priceDelta)}`:'+0원'})</span>
            </label>
          )
        })}
      </div>
      <button 
        className="btn" 
        onClick={()=> onAdd(item, selected)}
        disabled={isOutOfStock}
        style={{
          opacity: isOutOfStock ? 0.5 : 1,
          cursor: isOutOfStock ? 'not-allowed' : 'pointer'
        }}
      >
        {isOutOfStock ? '품절' : '담기'}
      </button>
    </div>
  )
}

export default function OrderPage(){
  const [menus, setMenus] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      setLoading(true)
      const menuData = await api.getMenus(true) // 재고 정보 포함
      setMenus(menuData)
    } catch (error) {
      console.error('메뉴 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (menu, selectedOptionIds)=>{
    const key = menu.id + '::' + selectedOptionIds.sort().join(',')
    setCart(prev =>{
      const found = prev.find(x=> x.key===key)
      if(found){
        return prev.map(x=> x.key===key ? { ...x, quantity: x.quantity+1 } : x)
      }
      const selectedOpts = options.filter(o=> selectedOptionIds.includes(o.id))
      const optionTotal = selectedOpts.reduce((s,o)=> s+o.priceDelta, 0)
      const unitPrice = menu.price + optionTotal
      return [...prev, { key, menu, selectedOpts, unitPrice, quantity: 1 }]
    })
  }

  const total = useMemo(()=> cart.reduce((s,i)=> s + i.unitPrice * i.quantity, 0), [cart])

  const changeQty = (key, delta)=>{
    setCart(prev=> prev.map(i=> i.key===key ? { ...i, quantity: Math.max(1, i.quantity+delta) } : i))
  }
  const removeItem = (key)=> setCart(prev=> prev.filter(i=> i.key!==key))

  const handleOrder = async () => {
    if (cart.length === 0) return
    
    console.log('=== 주문 시작 ===')
    console.log('장바구니:', cart)
    
    // 품절된 아이템이 있는지 확인
    const outOfStockItems = cart.filter(item => item.menu.stockQty <= 0)
    if (outOfStockItems.length > 0) {
      alert('품절된 메뉴가 장바구니에 있습니다. 품절된 메뉴를 제거해주세요.')
      return
    }
    
    try {
      setOrderLoading(true)
      const orderData = {
        items: cart.map(item => {
          const orderItem = {
            menuId: item.menu.id,
            quantity: item.quantity,
            optionIds: item.selectedOpts.map(opt => opt.id)
          }
          console.log('주문 아이템:', orderItem)
          return orderItem
        })
      }
      
      console.log('전송할 주문 데이터:', orderData)
      
      const result = await api.createOrder(orderData)
      console.log('주문 성공:', result)
      alert(`주문이 접수되었습니다! 주문번호: ${result.orderId}`)
      setCart([])
    } catch (error) {
      console.error('❌ 주문 실패:', error)
      console.error('에러 상세:', error.message)
      console.error('에러 스택:', error.stack)
      
      if (error.message.includes('재고가 부족')) {
        alert('재고가 부족합니다. 관리자 화면에서 재고를 확인해주세요.')
      } else {
        alert(`주문에 실패했습니다: ${error.message}`)
      }
    } finally {
      setOrderLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page" style={{marginLeft:'auto', marginRight:'auto', textAlign:'center', padding:'40px'}}>
        <div>메뉴를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="page" style={{marginLeft:'auto', marginRight:'auto'}}>
      <div className="grid">
        {menus.map(m=> (
          <MenuCard key={m.id} item={m} onAdd={addToCart} />
        ))}
      </div>

      <div className="cart">
        <div className="cart-header">장바구니</div>
        <div className="cart-list">
          {cart.length===0 && (
            <div style={{color:'#64748b'}}>장바구니가 비어 있습니다. 메뉴를 담아보세요.</div>
          )}
          {cart.map(item=> (
            <div className="cart-row" key={item.key}>
              <div>
                <div style={{fontWeight:700}}>{item.menu.name}</div>
                <div style={{color:'#6b7280',fontSize:14}}>
                  {item.selectedOpts.length>0 ? item.selectedOpts.map(o=>o.name).join(', ') : '옵션 없음'}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <button className="btn" style={{padding:'6px 10px'}} onClick={()=>changeQty(item.key,-1)}>-</button>
                <div style={{minWidth:20,textAlign:'center'}}>{item.quantity}</div>
                <button className="btn" style={{padding:'6px 10px'}} onClick={()=>changeQty(item.key,1)}>+</button>
                <div style={{width:96, textAlign:'right', fontVariantNumeric:'tabular-nums'}}>{formatCurrency(item.unitPrice*item.quantity)}</div>
                <button className="btn" style={{background:'#ef4444'}} onClick={()=>removeItem(item.key)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-right">
          <div className="cart-total">
            <div>총 금액</div>
            <div style={{fontVariantNumeric:'tabular-nums'}}>{formatCurrency(total)}</div>
          </div>
          <button className="btn" onClick={handleOrder} disabled={cart.length===0 || orderLoading}>
            {orderLoading ? '주문 중...' : '주문하기'}
          </button>
        </div>
      </div>
    </div>
  )
}


