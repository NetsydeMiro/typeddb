const { describe, it, before, after } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

import TypedDB from '../src/TypedDB'
import IterableStore from '../src/IterableStore'
import { spy } from 'sinon'

class QueryableEntity {
    anId: number
    aString: string
    aDate: Date
    aBoolean: boolean
    searchableString: string
    searchableReversedNumber: number
    searchableDate: Date
    searchableBoolean: boolean
}

function newEntity(anId: number, searchableReversedNumber: number): QueryableEntity {
    let result = new QueryableEntity()

    result.anId = anId
    result.aString = `string ${anId}`
    result.aDate = new Date(anId, 1, 1)
    result.aBoolean = Math.random() > .5

    result.searchableReversedNumber = searchableReversedNumber
    result.searchableString = `string ${anId.toString().padStart(5, '0')}`
    result.searchableDate = new Date(anId, 1, 1)
    result.searchableBoolean = Math.random() > .5

    return result
}

describe('IterableStore', function () {
    let db: TypedDB
    let entities: Array<QueryableEntity> 
    let entityStore: IterableStore<QueryableEntity, 'anId', 'searchableString' | 'searchableReversedNumber' | 'searchableDate' | 'searchableBoolean'>

    before(async () => {
        db = new TypedDB('IterateTestsDb', 1)
        await db.deleteDatabase()
        entityStore = db.defineStore(QueryableEntity, 'anId', ['searchableString', 'searchableReversedNumber', 'searchableDate', 'searchableBoolean'])
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
            let iterated = await entityStore.doIterate({index: "searchableString", count: 10}, () => {})
            expect(iterated).to.equal(10)
        })
        it('should return clipped iteration count if outside of bounds', async function () {
            let iterated = await entityStore.doIterate({ index: "searchableString", count: 200 }, () => { })
            expect(iterated).to.equal(entities.length)
        })
        it('should iterate correct number of times if count is within bounds', async function () {
            let cb = spy()
            await entityStore.doIterate({index: "searchableString", count: 10}, cb)
            expect(cb.callCount).to.equal(11)
        })
        it('should iterate clipped number of times if count specified outside of bounds', async function () {
            let cb = spy()
            await entityStore.doIterate({index: "searchableString", count: 200}, cb)
            expect(cb.callCount).to.equal(entities.length + 1)
        })
        it('should return null and -1 on final iteration', async function () {
            let cb = spy()
            await entityStore.doIterate({index: "searchableString", count: 5}, cb)
            expect(cb.lastCall.args).to.eql([null, -1])
        })
        it('should return correct entity and index when iterating', async function () {
            let cb = spy()
            await entityStore.doIterate({index: "searchableString", count: 3}, cb)

            expect(cb.getCall(0).args).to.eql([entities[0], 0])
            expect(cb.getCall(1).args).to.eql([entities[1], 1])
            expect(cb.getCall(2).args).to.eql([entities[2], 2])
        })
    })
})
