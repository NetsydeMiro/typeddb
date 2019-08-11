const { describe, it, before, after } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

import TypedDB from '../src/TypedDB'
import QueryableStore from '../src/QueryableStore'
import { spy } from 'sinon'
import { Range } from '../src/common';

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

describe('QueryableStore', function () {
    let db: TypedDB
    let entities: Array<QueryableEntity>
    let entityStore: QueryableStore<QueryableEntity, 'anId', 'searchableString' | 'searchableReversedNumber' | 'searchableDate' | 'searchableBoolean'>

    before(async () => {
        db = new TypedDB('QueryableTestsDb', 1)
        await db.deleteDatabase()
        entityStore = db.defineStore(QueryableEntity, 'anId', ['searchableString', 'searchableReversedNumber', 'searchableDate', 'searchableBoolean'])
        await db.open()

        entities = []
        for (let ix = 0; ix < 10; ix++) {
            entities.push(newEntity(ix + 1, 10 - ix))
        }

        await entityStore.addRange(entities)
    })

    after(() => {
        db.deleteDatabase()
    })

    describe('#doSelect', function () {

        describe('no parameters', () => {
            it('should return all the entities', async function () {
                let storedEntities = await entityStore.doSelect()
                expect(storedEntities).to.deep.equal(entities)
            })
        })

        describe('mapper supplied', () => {
            it('should map the entities', async function () {
                let mapper = (ent: QueryableEntity) => ent.aDate
                let dates = await entityStore.doSelect(mapper)
                expect(dates).to.deep.equal(entities.map(e => e.aDate))
            })
            it('should provide correct entity and index when selecting', async function () {
                let cb = spy()
                await entityStore.doSelect(cb)

                entities.forEach((entity, ix) => {
                    expect(cb.getCall(ix).args).to.deep.equal([entity, ix])
                })
            })
        })

        describe('count specified', () => {
            it('should return specified number of entities if within bounds', async function () {
                let selected = await entityStore.doSelect({ count: 3 })
                expect(selected).to.deep.equal(entities.slice(0, 3))
            })
            it('should return clipped result if outside of bounds', async function () {
                let selected = await entityStore.doSelect({ count: 200 })
                expect(selected).to.deep.equal(selected)
            })
            it('should provide correct entity and index when selecting', async function () {
                let cb = spy()
                await entityStore.doSelect({count: 3}, cb)

                expect(cb.callCount).to.equal(3)
                entities.slice(0, 3).forEach((entity, ix) => {
                    expect(cb.getCall(ix).args).to.deep.equal([entity, ix])
                })
            })
        })

        describe('skip specified', () => {
            it('should return correct entities if within bounds', async function () {
                let selected = await entityStore.doSelect({ count: 3, skip: 3 })
                expect(selected).to.deep.equal(entities.slice(3, 6))
            })
            it('should return clipped entities if outside of bounds', async function () {
                let selected = await entityStore.doSelect({ count: 3, skip: 9 })
                expect(selected).to.deep.equal([entities[9]])
            })
            it('should provide correct entity and index when selecting', async function () {
                let cb = spy()
                await entityStore.doSelect({ count: 3, skip: 3 }, cb)

                expect(cb.callCount).to.equal(3)
                entities.slice(3, 6).forEach((entity, ix) => {
                    expect(cb.getCall(ix).args).to.deep.equal([entity, ix])
                })
            })
        })

        /*

        describe('direction specified', () => {
            it('should return correct entity and index when iterating', async function () {
                let cb = spy()
                await entityStore.doIterate({ count: 3, direction: 'descending' }, cb)

                for (let ix = 0; ix < 3; ix++) {
                    expect(cb.getCall(ix).args).to.eql([entities[9 - ix], ix])
                }
            })
            it('should return correct entity and index when iterating from skipped position', async function () {
                let cb = spy()
                await entityStore.doIterate({ count: 3, skip: 3, direction: 'descending' }, cb)

                for (let ix = 0; ix < 3; ix++) {
                    expect(cb.getCall(ix).args).to.eql([entities[6 - ix], ix])
                }
            })
        })

        describe('bounds specified', () => {
            it('should return correct entities and indices', async function () {
                let cb = spy()
                await entityStore.doIterate({ count: 3, range: Range.greaterThan(3) }, cb)

                let filtered = entities.filter(e => e.anId > 3)
                for (let ix = 0; ix < 3; ix++) {
                    expect(cb.getCall(ix).args).to.eql([filtered[ix], ix])
                }
            })
            it('should cease iterating if boundary reached', async function () {
                let cb = spy()
                let iteratedCount = await entityStore.doIterate({ count: 3, skip: 3, range: Range.greaterThan(5), direction: 'descending' }, cb)

                expect(iteratedCount).to.equal(2)
                for (let ix = 0; ix < 2; ix++) {
                    expect(cb.getCall(ix).args).to.eql([entities[9 - 3 - ix], ix])
                }
            })
            it('should not iterate if range yields no entities', async function () {
                let cb = spy()
                let iteratedCount = await entityStore.doIterate({ count: 3, range: Range.greaterThan(11) }, cb)

                expect(iteratedCount).to.equal(0)
                expect(cb.calledOnce).to.be.true
                expect(cb.getCall(0).args).to.eql([null, -1])
            })
        })

        describe('bound types', () => {
            describe('equal to', () => {
                it('should return correct entities and indices', async () => {
                    let cb = spy()
                    let iteratedCount = await entityStore.doIterate({ range: Range.equalTo(3) }, cb)

                    expect(iteratedCount).to.equal(1)
                    expect(cb.callCount).to.equal(2)

                    let filtered = entities.filter(e => e.anId == 3)
                    filtered.forEach((entity, ix) => {
                        expect(cb.getCall(ix).args).to.eql([entity, ix])
                    })
                })
            })
            describe('less than', () => {
                it('should return correct entities and indices', async () => {
                    let cb = spy()
                    let iteratedCount = await entityStore.doIterate({ range: Range.lessThan(3) }, cb)

                    expect(iteratedCount).to.equal(2)
                    expect(cb.callCount).to.equal(3)

                    let filtered = entities.filter(e => e.anId < 3)
                    filtered.forEach((entity, ix) => {
                        expect(cb.getCall(ix).args).to.eql([entity, ix])
                    })
                })
            })
            describe('less than or equal to', () => {
                it('should return correct entities and indices', async () => {
                    let cb = spy()
                    let iteratedCount = await entityStore.doIterate({ range: Range.lessThanOrEqualTo(3) }, cb)

                    expect(iteratedCount).to.equal(3)
                    expect(cb.callCount).to.equal(4)

                    let filtered = entities.filter(e => e.anId <= 3)
                    filtered.forEach((entity, ix) => {
                        expect(cb.getCall(ix).args).to.eql([entity, ix])
                    })
                })
            })
            describe('greater than', () => {
                it('should return correct entities and indices', async () => {
                    let cb = spy()
                    let iteratedCount = await entityStore.doIterate({ range: Range.greaterThan(8) }, cb)

                    expect(iteratedCount).to.equal(2)
                    expect(cb.callCount).to.equal(3)

                    let filtered = entities.filter(e => e.anId > 8)
                    filtered.forEach((entity, ix) => {
                        expect(cb.getCall(ix).args).to.eql([entity, ix])
                    })
                })
            })
            describe('greater than or equal to', () => {
                it('should return correct entities and indices', async () => {
                    let cb = spy()
                    let iteratedCount = await entityStore.doIterate({ range: Range.greaterThanOrEqualTo(8) }, cb)

                    expect(iteratedCount).to.equal(3)
                    expect(cb.callCount).to.equal(4)

                    let filtered = entities.filter(e => e.anId >= 8)
                    filtered.forEach((entity, ix) => {
                        expect(cb.getCall(ix).args).to.eql([entity, ix])
                    })
                })
            })
            describe('between', () => {
                it('should return correct entities and indices', async () => {
                    let cb = spy()
                    let iteratedCount = await entityStore.doIterate({ range: Range.between(4, 8) }, cb)

                    expect(iteratedCount).to.equal(5)
                    expect(cb.callCount).to.equal(6)

                    let filtered = entities.filter(e => 4 <= e.anId && e.anId <= 8)
                    filtered.forEach((entity, ix) => {
                        expect(cb.getCall(ix).args).to.eql([entity, ix])
                    })
                })
                it('can specify open lower bound', async () => {
                    let cb = spy()
                    let iteratedCount = await entityStore.doIterate({ range: Range.between(4, 8, {excludeMin: true}) }, cb)

                    expect(iteratedCount).to.equal(4)
                    expect(cb.callCount).to.equal(5)

                    let filtered = entities.filter(e => 4 < e.anId && e.anId <= 8)
                    filtered.forEach((entity, ix) => {
                        expect(cb.getCall(ix).args).to.eql([entity, ix])
                    })
                })
                it('can specify open upper bound', async () => {
                    let cb = spy()
                    let iteratedCount = await entityStore.doIterate({ range: Range.between(4, 8, { excludeMax: true }) }, cb)

                    expect(iteratedCount).to.equal(4)
                    expect(cb.callCount).to.equal(5)

                    let filtered = entities.filter(e => 4 <= e.anId && e.anId < 8)
                    filtered.forEach((entity, ix) => {
                        expect(cb.getCall(ix).args).to.eql([entity, ix])
                    })
                })
            })
        })
        describe("Index Specified", () => {
            it('should return correct entities and indices', async function () {
                let cb = spy()
                let iteratedCount = await entityStore.doIterate({ index: 'searchableReversedNumber' }, cb)

                expect(iteratedCount).to.equal(entities.length)
                expect(cb.callCount).to.equal(entities.length + 1)

                for (let ix = 0; ix < entities.length; ix++) {
                    expect(cb.getCall(ix).args).to.eql([entities[entities.length-ix-1], ix])
                }
            })
        })
        */
    })
})
