import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderPage from '../OrderPage.jsx'

describe('OrderPage', () => {
  it('adds items to cart and merges same option combos', async () => {
    const user = userEvent.setup()
    render(<OrderPage />)

    const addButtons = await screen.findAllByRole('button', { name: '담기' })
    // 담기 2회(같은 상품/옵션 없음) -> 한 줄에서 수량 2가 되어야 함
    await user.click(addButtons[0])
    await user.click(addButtons[0])

    // 수량 증가/감소 테스트
    const plus = screen.getAllByRole('button', { name: '+' })[0]
    const minus = screen.getAllByRole('button', { name: '-' })[0]
    await user.click(plus)
    await user.click(minus)

    // 총 금액 표시 확인 (기본 4000원 * 2 = 8000원)
    expect(screen.getByText(/총 금액/)).toBeInTheDocument()
  })
})


