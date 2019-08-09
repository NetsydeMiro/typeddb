const { describe, it, before, after } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

import TypedDB from '../src/TypedDB'
import IterableStore from '../src/IterableStore'
import { spy } from 'sinon'
import { Range } from '../src/common';

class IterableEntity {
    anId: number
    aString: string
    aDate: Date
    aBoolean: boolean
    searchableString: string
    searchableReversedNumber: number
    searchableDate: Date
    searchableBoolean: boolean
}

function newEntity(anId: number, searchableReversedNumber: number): IterableEntity {
    let result = new IterableEntity()

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
    let entities: Array<IterableEntity>
    let entityStore: IterableStore<IterableEntity, 'anId', 'searchableString' | 'searchableReversedNumber' | 'searchableDate' | 'searchableBoolean'>

    before(async () => {
        db = new TypedDB('IterateTestsDb', 1)
        await db.deleteDatabase()
        entityStore = db.defineStore(IterableEntity, 'anId', ['searchableString', 'searchableReversedNumber', 'searchableDate', 'searchableBoolean'])
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

    describe('#doIterate', function () {

        describe('no parameters', () => {
            it('should return correct iteration count', async function () {
                let iteratedCount = await entityStore.doIterate(() => { })
                expect(iteratedCount).to.equal(entities.length)
            })
            it('should iterate correct number of times', async function () {
                let cb = spy()
                await entityStore.doIterate(cb)
                expect(cb.callCount).to.equal(entities.length + 1)
            })
            it('should return null and -1 on final iteration', async function () {
                let cb = spy()
                await entityStore.doIterate(cb)
                expect(cb.lastCall.args).to.eql([null, -1])
            })
            it('should return correct entity and index when iterating', async function () {
                let cb = spy()
                await entityStore.doIterate(cb)

                entities.forEach((entity, ix) => {
                    expect(cb.getCall(ix).args).to.eql([entity, ix])
                })
            })
        })

        describe('count specified', () => {
            it('should return correct iteration count if within bounds', async function () {
                let iteratedCount = await entityStore.doIterate({ count: 3 }, () => { })
                expect(iteratedCount).to.equal(3)
            })
            it('should return clipped iteration count if outside of bounds', async function () {
                let iteratedCount = await entityStore.doIterate({ count: 200 }, () => { })
                expect(iteratedCount).to.equal(entities.length)
            })
            it('should iterate correct number of times if count is within bounds', async function () {
                let cb = spy()
                await entityStore.doIterate({ count: 3 }, cb)
                expect(cb.callCount).to.equal(4)
            })
            it('should iterate clipped number of times if count specified outside of bounds', async function () {
                let cb = spy()
                await entityStore.doIterate({ index: "searchableString", count: 200 }, cb)
                expect(cb.callCount).to.equal(entities.length + 1)
            })
            it('should return null and -1 on final iteration', async function () {
                let cb = spy()
                await entityStore.doIterate({ index: "searchableString", count: 3 }, cb)
                expect(cb.lastCall.args).to.eql([null, -1])
            })
            it('should return correct entity and index when iterating', async function () {
                let cb = spy()
                await entityStore.doIterate({ index: "searchableString", count: 3 }, cb)

                for (let ix = 0; ix < 3; ix++) {
                    expect(cb.getCall(ix).args).to.eql([entities[ix], ix])
                }
            })
        })

        describe('skip specified', () => {
            it('should return correct iteration count if within bounds', async function () {
                let iteratedCount = await entityStore.doIterate({ count: 3, skip: 3 }, () => { })
                expect(iteratedCount).to.equal(3)
            })
            it('should return clipped iteration count if outside of bounds', async function () {
                let iteratedCount = await entityStore.doIterate({ count: 3, skip: 9 }, () => { })
                expect(iteratedCount).to.equal(1)
            })
            it('should return correct entity and index when iterating', async function () {
                let cb = spy()
                await entityStore.doIterate({ count: 3, skip: 3 }, cb)

                for (let ix = 0; ix < 3; ix++) {
                    expect(cb.getCall(ix).args).to.eql([entities[ix + 3], ix])
                }
            })
        })

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

        describe('boundary specified', () => {
            it('should return correct entity and index when iterating', async function () {
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
                let iterated = await entityStore.doIterate({ count: 3, range: Range.greaterThan(11) }, cb)

                expect(iterated).to.equal(0)
                expect(cb.calledOnce).to.be.true
                expect(cb.getCall(0).args).to.eql([null, -1])
            })
        })
    })
})
