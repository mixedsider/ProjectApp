import { useMemo, useState } from 'react'

const mockMenus = [
  { id: 'americano-ice', name: '아메리카노(ICE)', price: 4000, description: '깔끔한 산미와 청량감', imageUrl: '/img/americano-ice.jpg' },
  { id: 'americano-hot', name: '아메리카노(HOT)', price: 4000, description: '균형 잡힌 바디감', imageUrl: '/img/americano-hot.jpg' },
  { id: 'caffe-latte', name: '카페라떼', price: 5000, description: '부드러운 우유 거품', imageUrl: '/img/caffe-latte.jpg' },
]

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
  return (
    <div className="card">
      <div className="thumb" style={{backgroundImage:`url(${item.imageUrl})`,backgroundSize:'cover',backgroundPosition:'center'}} />
      <div className="title">{item.name}</div>
      <div className="price">{formatCurrency(item.price)}</div>
      <div className="options">
        {options.map(opt=>{
          const checked = selected.includes(opt.id)
          return (
            <label key={opt.id} style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" checked={checked} onChange={()=>toggle(opt.id)} />
              <span>{opt.name} ({opt.priceDelta>0?`+${formatCurrency(opt.priceDelta)}`:'+0원'})</span>
            </label>
          )
        })}
      </div>
      <button className="btn" onClick={()=> onAdd(item, selected)}>
        담기
      </button>
    </div>
  )
}

export default function OrderPage(){
  const [cart, setCart] = useState([])

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

  return (
    <div className="page" style={{marginLeft:'auto', marginRight:'auto'}}>
      <div className="grid">
        {mockMenus.map(m=> (
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
          <button className="btn">주문하기</button>
        </div>
      </div>
    </div>
  )
}


