const { describe, it, before, beforeEach } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

import TypedDB from '../src/TypedDB'
import TypedStore from '../src/TypedStore'

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
    let entityStore: TypedStore<Entity, 'anId'>

    before(async () => {
        db = new TypedDB('CrudTestsDb', 1)
        await db.deleteDatabase()
        entityStore = db.defineStore(Entity, 'anId')
        await db.open()
    })

    beforeEach(() => {
        entityStore.clear()
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
        it('should raise an error event if adding pre-existing entity', async function () {
            let createdEntity = newEntity(1)
            await entityStore.add(createdEntity)

            try {
                await entityStore.add(createdEntity)
            }
            catch (event) {
                expect(event).to.be.instanceOf(Event)
                expect(event.type).to.equal('error')
            }

            let storedEntities = await entityStore.getAll()
            expect(storedEntities).to.be.of.length(1)
        })
    })

    describe('#addRange', function () {
        it('should add the entities', async function () {
            let storedEntities = await entityStore.getAll()
            expect(storedEntities.length).to.equal(0)

            let createdEntities = [newEntity(1), newEntity(2)]
            await entityStore.addRange(createdEntities)

            storedEntities = await entityStore.getAll()
            expect(storedEntities).to.be.of.length(2)
        })
        it('should raise an error event and add no entities if adding duplicate keys', async function () {
            let createdEntities = [newEntity(1), newEntity(1)]

            try {
                await entityStore.addRange(createdEntities)
            }
            catch (event) {
                expect(event).to.be.instanceOf(Event)
                expect(event.type).to.equal('error')
            }

            let storedEntities = await entityStore.getAll()
            expect(storedEntities).to.be.of.length(0)
        })
    })

    describe('#get', function () {
        it('should retrieve the entity', async function () {
            let createdEntity = newEntity(1)
            await entityStore.add(createdEntity)
            let retrievedEntity = await entityStore.get(1)

            expect(retrievedEntity).to.eql(createdEntity)
        })
        it('should retrieve entity of the correct type', async function () {
            let createdEntity = newEntity(1)
            await entityStore.add(createdEntity)
            let retrievedEntity = await entityStore.get(1)

            expect(retrievedEntity).to.be.instanceOf(Entity)
        })
    })

    describe('#getAll', function () {
        it('should retrieve the entities', async function () {
            let createdEntity = newEntity(1)
            await entityStore.add(createdEntity)

            let createdEntity2 = newEntity(2)
            await entityStore.add(createdEntity2)

            let retrievedEntities = await entityStore.getAll()

            expect(retrievedEntities).to.eql([createdEntity, createdEntity2])
        })
        it('should retrieve entities of the correct type', async function () {
            let createdEntity = newEntity(1)
            await entityStore.add(createdEntity)

            let createdEntity2 = newEntity(2)
            await entityStore.add(createdEntity2)

            let retrievedEntities = await entityStore.getAll()

            retrievedEntities.every(e => expect(e).to.be.instanceOf(Entity))
        })
    })

    describe('#put', function () {
        it('should alter the stored entity if it has matching key', async function () {
            let createdEntity = newEntity(1)
            await entityStore.add(createdEntity)

            createdEntity.aString = "Changed Here"

            await entityStore.put(createdEntity)

            let retrievedEntity = await entityStore.get(1)

            expect(retrievedEntity.aString).to.equal("Changed Here")
        })
        it('should add a new entity if it has new key', async function () {
            let createdEntity = newEntity(1)
            await entityStore.add(createdEntity)

            createdEntity.anId = 2
            createdEntity.aString = 'New entity'

            await entityStore.put(createdEntity)

            let retrievedEntity = await entityStore.get(2)

            expect(retrievedEntity.aString).to.equal("New entity")
        })
    })

    describe('#delete', function () {
        it('should delete the specified entity', async function () {
            let createdEntity = newEntity(1)
            let createdEntity2 = newEntity(2)
            
            await entityStore.addRange([createdEntity, createdEntity2])

            await entityStore.delete(2)

            let retrievedEntities = await entityStore.getAll()
            expect(retrievedEntities).to.eql([createdEntity])
        })
    })

    describe('#clear', function () {
        it('should delete all the entities', async function () {
            let createdEntity = newEntity(1)
            let createdEntity2 = newEntity(2)
            
            await entityStore.addRange([createdEntity, createdEntity2])

            await entityStore.clear()

            let retrievedEntities = await entityStore.getAll()
            expect(retrievedEntities).to.be.empty
        })
    })
})
