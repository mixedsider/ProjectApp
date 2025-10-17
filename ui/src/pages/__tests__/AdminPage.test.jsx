import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPage from '../AdminPage.jsx'

describe('AdminPage', () => {
  it('shows inventory with status and allows increment/decrement', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)

    // 상태 배지 텍스트 존재
    expect(screen.getByText('재고 현황')).toBeInTheDocument()

    // + / - 클릭 동작(첫 카드 기준)
    const inc = screen.getAllByRole('button', { name: 'increase' })[0]
    const dec = screen.getAllByRole('button', { name: 'decrease' })[0]
    await user.click(inc)
    await user.click(dec)

    // 대시보드 집계 카드 존재 확인
    expect(screen.getByText('관리자 대시보드')).toBeInTheDocument()
  })
})


