import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
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
      { menuId: americanoIce.id, name: '샷 추가', priceDelta: 500 },
      { menuId: americanoIce.id, name: '시럽 추가', priceDelta: 0 },
      { menuId: americanoHot.id, name: '샷 추가', priceDelta: 500 },
      { menuId: americanoHot.id, name: '시럽 추가', priceDelta: 0 },
      { menuId: caffeLatte.id, name: '샷 추가', priceDelta: 500 },
      { menuId: caffeLatte.id, name: '시럽 추가', priceDelta: 0 },
    ],
  })

  console.log('시드 데이터가 성공적으로 생성되었습니다.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
