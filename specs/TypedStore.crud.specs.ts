const { describe, it, before, beforeEach, after } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

import TypedDB from '../src/TypedDB'
import TypedStore from '../src/TypedStore'
import QueryableStore from '../src/QueryableStore'

class Entity {
    anId: number
    aString: string
    aDate: Date
    aBoolean: boolean
}

function newEntity(anId: number): Entity {
    let result = new Entity()

    result.anId = anId
    result.aString = `string ${anId}`
    result.aDate = new Date(anId, 1, 1)
    result.aBoolean = Math.random() > .5

    return result
}

describe('TypedStore CRUD Operations', function () {
    let db: TypedDB
    let typedStore: QueryableStore<Entity, 'anId', null>

    before(async () => {
        db = new TypedDB('CrudTestsDb', 1)
        await db.deleteDatabase()
        typedStore = db.defineStore(Entity, 'anId')
        await db.open()
    })

    beforeEach(() => {
        typedStore.clear()
    })

    after(() => {
        db.deleteDatabase()
    })

    describe('#add', function () {
        it('should add the entity', async function () {
            let storedEntities = await typedStore.getAll()
            expect(storedEntities.length).to.equal(0)

            let createdEntity = newEntity(1)
            await typedStore.add(createdEntity)

            storedEntities = await typedStore.getAll()
            expect(storedEntities).to.be.of.length(1)
        })
        it('should raise an error event if adding pre-existing entity', async function () {
            let createdEntity = newEntity(1)
            await typedStore.add(createdEntity)

            try {
                await typedStore.add(createdEntity)
            }
            catch (event) {
                expect(event).to.be.instanceOf(Event)
                expect(event.type).to.equal('error')
            }

            let storedEntities = await typedStore.getAll()
            expect(storedEntities).to.be.of.length(1)
        })
    })

    describe('#addRange', function () {
        it('should add the entities', async function () {
            let storedEntities = await typedStore.getAll()
            expect(storedEntities.length).to.equal(0)

            let createdEntities = [newEntity(1), newEntity(2)]
            await typedStore.addRange(createdEntities)

            storedEntities = await typedStore.getAll()
            expect(storedEntities).to.be.of.length(2)
        })
        it('should raise an error event and add no entities if adding duplicate keys', async function () {
            let createdEntities = [newEntity(1), newEntity(1)]

            try {
                await typedStore.addRange(createdEntities)
            }
            catch (event) {
                expect(event).to.be.instanceOf(Event)
                expect(event.type).to.equal('error')
            }

            let storedEntities = await typedStore.getAll()
            expect(storedEntities).to.be.of.length(0)
        })
    })

    describe('#get', function () {
        it('should retrieve the entity', async function () {
            let createdEntity = newEntity(1)
            await typedStore.add(createdEntity)
            let retrievedEntity = await typedStore.get(1)

            expect(retrievedEntity).to.eql(createdEntity)
        })
        it('should retrieve entity of the correct type', async function () {
            let createdEntity = newEntity(1)
            await typedStore.add(createdEntity)
            let retrievedEntity = await typedStore.get(1)

            expect(retrievedEntity).to.be.instanceOf(Entity)
        })
    })

    describe('#getAll', function () {
        it('should retrieve the entities', async function () {
            let createdEntity = newEntity(1)
            await typedStore.add(createdEntity)

            let createdEntity2 = newEntity(2)
            await typedStore.add(createdEntity2)

            let retrievedEntities = await typedStore.getAll()

            expect(retrievedEntities).to.eql([createdEntity, createdEntity2])
        })
        it('should retrieve entities of the correct type', async function () {
            let createdEntity = newEntity(1)
            await typedStore.add(createdEntity)

            let createdEntity2 = newEntity(2)
            await typedStore.add(createdEntity2)

            let retrievedEntities = await typedStore.getAll()

            retrievedEntities.every(e => expect(e).to.be.instanceOf(Entity))
        })
    })

    describe('#put', function () {
        it('should alter the stored entity if it has matching key', async function () {
            let createdEntity = newEntity(1)
            await typedStore.add(createdEntity)

            createdEntity.aString = "Changed Here"

            await typedStore.put(createdEntity)

            let retrievedEntity = await typedStore.get(1)

            expect(retrievedEntity.aString).to.equal("Changed Here")
        })
        it('should add a new entity if it has new key', async function () {
            let createdEntity = newEntity(1)
            await typedStore.add(createdEntity)

            createdEntity.anId = 2
            createdEntity.aString = 'New entity'

            await typedStore.put(createdEntity)

            let retrievedEntity = await typedStore.get(2)

            expect(retrievedEntity.aString).to.equal("New entity")
        })
    })

    describe('#delete', function () {
        it('should delete the specified entity', async function () {
            let createdEntity = newEntity(1)
            let createdEntity2 = newEntity(2)
            
            await typedStore.addRange([createdEntity, createdEntity2])

            await typedStore.delete(2)

            let retrievedEntities = await typedStore.getAll()
            expect(retrievedEntities).to.eql([createdEntity])
        })
    })

    describe('#clear', function () {
        it('should delete all the entities', async function () {
            let createdEntity = newEntity(1)
            let createdEntity2 = newEntity(2)
            
            await typedStore.addRange([createdEntity, createdEntity2])

            await typedStore.clear()

            let retrievedEntities = await typedStore.getAll()
            expect(retrievedEntities).to.be.empty
        })
    })
})
