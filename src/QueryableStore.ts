import { Direction, EntityClass, Exclusions } from './common'
import { EqualTo, GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, Between } from './common'
import TypedDB from './TypedDB'
import { IterableStore, OptionalIterateParams, IterateParams } from './IterableStore'

/*
Query Builder
store.select().having('propName').ascending()
store.select(10).having('propName').descending()
store.select(10, 20).having('propName').ascending()
store.select(10, 20).having('propName').greaterThanOrEqualTo(val).ascending()
*/

class DslDirection<TEntity> {
    constructor(protected store: QueryableStore<TEntity, any, any>, protected params: IterateParams<TEntity, any>) { }

    private doSelect(direction: Direction) {
        let builtParams: IterateParams<TEntity, any> = { ...this.params, direction }
        return this.store.doSelect(builtParams)
    }

    ascending(): Promise<Array<TEntity>> {
        return this.doSelect("ascending")
    }

    descending(): Promise<Array<TEntity>> {
        return this.doSelect("descending")
    }
}

class DslBoundaryOrDirection<TEntity, TProperty> extends DslDirection<TEntity> {
    constructor(store: QueryableStore<TEntity, any, any>, params: IterateParams<TEntity, any>) { 
        super(store, params) 
    }

    equaling(val: TProperty): DslDirection<TEntity> {
        let range = new EqualTo<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    greaterThan(val: TProperty): DslDirection<TEntity> {
        let range = new GreaterThan<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    greaterThanOrEqualTo(val: TProperty): DslDirection<TEntity> {
        let range = new GreaterThanOrEqual<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    lessThan(val: TProperty): DslDirection<TEntity> {
        let range = new LessThan<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    lessThanOrEqualTo(val: TProperty): DslDirection<TEntity> {
        let range = new LessThanOrEqual<TProperty>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    between(min: TProperty, max: TProperty, exclusions?: Exclusions): DslDirection<TEntity> {
        let range = new Between<TProperty>(min, max, exclusions) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }
}

class DslHaving<TEntity, TIndices extends keyof TEntity> {
    constructor(private store: QueryableStore<TEntity, any, any>, private params: OptionalIterateParams<TEntity, any>) { }

    having(index: TIndices): DslBoundaryOrDirection<TEntity, TEntity[TIndices]> {

        let builtParams: IterateParams<TEntity, TIndices> = {
            ...this.params, ...{ index }
        }

        return new DslBoundaryOrDirection(this.store, builtParams)
    }
}

export class QueryableStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> extends IterableStore<TEntity, TIdProp, TIndices>
{
    constructor(db: TypedDB, entityClass: EntityClass<TEntity>, idProp: TIdProp, queryableProps: Array<TIndices>) {
        super(db, entityClass, idProp, queryableProps)
    }

    doSelect(params: IterateParams<TEntity, TIndices>): Promise<Array<TEntity>> {
        return new Promise<Array<TEntity>>((resolve, reject) => {
            let result: Array<TEntity> = []

            try {
                this.doIterate(params, (entity) => {
                    if (entity) result.push(entity)
                    else resolve(result)
                })
            }
            catch (ex) { reject(ex) }
        })
    }

    select(count?: number, skip?: number): DslHaving<TEntity, TIndices> {
        let params: OptionalIterateParams<TEntity, TIndices> = {
            count,
            skip
        }
        return new DslHaving(this, params)
    }
}

export default QueryableStore
