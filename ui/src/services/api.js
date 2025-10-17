const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    console.log(`🌐 API 요청: ${options.method || 'GET'} ${url}`)
    console.log('요청 설정:', config)

    try {
      const response = await fetch(url, config)
      console.log(`📡 응답 상태: ${response.status} ${response.statusText}`)
      
      const data = await response.json()
      console.log('응답 데이터:', data)

      if (!response.ok) {
        console.error(`❌ API 에러: ${response.status}`, data)
        throw new Error(data.error || data.message || `HTTP ${response.status}`)
      }

      console.log('✅ API 성공')
      return data
    } catch (error) {
      console.error(`❌ API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // 메뉴 관련
  async getMenus(includeStock = false) {
    const params = includeStock ? '?includeStock=true' : ''
    return this.request(`/menus${params}`)
  }

  // 주문 관련
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`)
  }

  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/orders?${queryString}` : '/orders'
    return this.request(endpoint)
  }

  async updateOrderStatus(orderId, status) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async cancelOrder(orderId) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
  }

  // 재고 관련
  async updateMenuStock(menuId, delta) {
    return this.request(`/menus/${menuId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    })
  }
}

export default new ApiService()
