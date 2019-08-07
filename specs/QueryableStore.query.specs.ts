const { describe, it, before, beforeEach, after } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

import TypedDB from '../src/TypedDB'
import QueryableStore from '../src/QueryableStore'

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

function newEntity(anId: number): QueryableEntity {
    let result = new QueryableEntity()

    result.anId = anId
    result.aString = `string ${anId}`
    result.aDate = new Date(anId, 1, 1)
    result.aBoolean = Math.random() > .5

    result.searchableNumber = anId
    result.searchableString = `string ${anId}`
    result.searchableDate = new Date(anId, 1, 1)
    result.searchableBoolean = Math.random() > .5

    return result
}

describe('QueryableStore Query Operations', function () {
    let db: TypedDB
    let entityStore: QueryableStore<QueryableEntity, 'anId', 'searchableString' | 'searchableNumber' | 'searchableDate' | 'searchableBoolean'>

    before(async () => {
        db = new TypedDB('QueryTestsDb', 1)
        await db.deleteDatabase()
        entityStore = db.defineStore(QueryableEntity, 'anId', ['searchableString', 'searchableNumber', 'searchableDate', 'searchableBoolean'])
        await db.open()
    })

    beforeEach(() => {
        entityStore.clear()
    })

    after(() => {
        db.deleteDatabase()
    })

    describe('#add', function () {
        it('should add the entity', async function () {
            let storedEntities = await entityStore.getAll()
            expect(storedEntities.length).to.equal(0)

            let createdEntity = newEntity(1)
            await entityStore.add(createdEntity)

            storedEntities = await entityStore.getAll()
            expect(storedEntities).to.be.of.length(1)
        })
    })
})
