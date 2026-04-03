import seedData from './seed.json'

const users = seedData['users']
const stores = seedData['stores']
const products = seedData['products']

type SampleUsersType = (typeof users)[0]
type SampleStoresType = (typeof stores)[0]
type SampleProductsType = (typeof products)[0]

export const SampleUsers: SampleUsersType[] = users
export const SampleStores: SampleStoresType[] = stores
export const SampleProducts: SampleProductsType[] = products
