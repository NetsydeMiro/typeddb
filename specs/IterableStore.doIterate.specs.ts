const { describe, it, before, after } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

import TypedDB from '../src/TypedDB'
import IterableStore from '../src/IterableStore'

class QueryableEntity {
    anId: number
    aString: string
    aDate: Date
    aBoolean: boolean
    searchableString: string
    searchableNumber: number
    searchableDate: Date
    searchableBoolean: boolean
}

function newEntity(anId: number, searchableNumber: number): QueryableEntity {
    let result = new QueryableEntity()

    result.anId = anId
    result.aString = `string ${anId}`
    result.aDate = new Date(anId, 1, 1)
    result.aBoolean = Math.random() > .5

    result.searchableNumber = searchableNumber
    result.searchableString = `string ${anId}`
    result.searchableDate = new Date(anId, 1, 1)
    result.searchableBoolean = Math.random() > .5

    return result
}

describe('IterableStore', function () {
    let db: TypedDB
    let entities: Array<QueryableEntity> 
    let entityStore: IterableStore<QueryableEntity, 'anId', 'searchableString' | 'searchableNumber' | 'searchableDate' | 'searchableBoolean'>

    before(async () => {
        db = new TypedDB('IterateTestsDb', 1)
        await db.deleteDatabase()
        entityStore = db.defineStore(QueryableEntity, 'anId', ['searchableString', 'searchableNumber', 'searchableDate', 'searchableBoolean'])
        await db.open()

        entities = []
        for(let ix = 0; ix < 100; ix++) {
            entities.push(newEntity(ix + 1, 100 - ix))
        }

        await entityStore.addRange(entities)
    })

    after(() => {
        db.deleteDatabase()
    })

    describe('#doIterate', function () {
        it('should return correct iteration count if within bounds', async function () {
            let iterated = await entityStore.doIterate({index: "searchableNumber", count: 10}, () => {})
            expect(iterated).to.equal(10)
        })
        it('should return clipped iteration count if outside of bounds', async function () {
            let iterated = await entityStore.doIterate({ index: "searchableNumber", count: 200 }, () => { })
            expect(iterated).to.equal(100)
        })
    })
})
