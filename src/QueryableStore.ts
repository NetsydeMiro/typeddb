import { Direction, EntityClass } from './common'
import TypedDB from './TypedDB'
import TypedStore from './TypedStore'

/*
Query Operations
store.findAllHaving.propName.greaterThan(val, "ascending")
store.findFirstHaving.propName.greaterThanOrEqualTo(val)
store.find(10).having.propName.greaterThanOrEqualTo(val, "descending")
store.find(10).skip(20).having.propName.greaterThanOrEqualTo(val)

Iterator Operations
store.iterate().having.propName.all()
store.iterate().having.propName.all("descending")
store.iterate().having.propName.greaterThanOrEqualTo(val)
store.iterate(10).having.propName.lessThanOrEqualTo(val, "descending")
store.iterate(10).skip(20).having.propName.between(lowerVal, upperVal, "descending")
*/

interface QueryableProperty<TEntity, TProperty> {
    equaling(val: TProperty): Promise<Array<TEntity>>
    greaterThan(val: TProperty, dir?: Direction): Promise<Array<TEntity>>
    greaterThanOrEqualTo(val: TProperty, dir?: Direction): Promise<Array<TEntity>>
    lessThan(val: TProperty, dir?: Direction): Promise<Array<TEntity>>
    lessThanOrEqualTo(val: TProperty, dir?: Direction): Promise<Array<TEntity>>
    between(min: TProperty, max: TProperty, dir?: Direction): Promise<Array<TEntity>>
}

type QueryOperations<TEntity, TQueryableProps extends keyof TEntity> = {
    [k in TQueryableProps]: QueryableProperty<TEntity, TEntity[k]>
}

function performReadonlyQuery(db: TypedDB, storeName: string, indexName: string, range: IDBKeyRange): Promise<Array<any>> {
    return new Promise<Array<any>>((resolve, reject) => {

        let index = db.indexedDB.transaction(storeName)
            .objectStore(storeName)
            .index(indexName)

        let req = index.openCursor(range)

        let entities: Array<any> = []

        req.onsuccess = (event) => {
            let cursor = (event.target as any).result as IDBCursorWithValue

            if (cursor) {
                entities.push(cursor.value)
                cursor.continue()
            }
        }

        resolve(entities)

        req.onerror = reject
    })
}

function createQueryOperations<TEntity, TQueryableProps extends keyof TEntity>(
    db: TypedDB,
    entityClass: EntityClass<TEntity>,
    queryableProps: Array<TQueryableProps>): QueryOperations<TEntity, TQueryableProps> {

    let findHaving: QueryOperations<TEntity, TQueryableProps> = {} as QueryOperations<TEntity, TQueryableProps>

    entityClass.name

    for (var queryableProp in queryableProps) {
        findHaving[queryableProp] = {
            equaling(val): Promise<Array<TEntity>> {
                let range = IDBKeyRange.only(val)
                return performReadonlyQuery(db, entityClass.name, queryableProp, range)
            },
            greaterThan(val): Promise<Array<TEntity>> {
                let range = IDBKeyRange.lowerBound(val, true)
                return performReadonlyQuery(db, entityClass.name, queryableProp, range)
            },
            greaterThanOrEqualTo(val): Promise<Array<TEntity>> {
                let range = IDBKeyRange.lowerBound(val)
                return performReadonlyQuery(db, entityClass.name, queryableProp, range)
            },
            lessThan(val): Promise<Array<TEntity>> {
                let range = IDBKeyRange.upperBound(val, true)
                return performReadonlyQuery(db, entityClass.name, queryableProp, range)
            },
            lessThanOrEqualTo(val): Promise<Array<TEntity>> {
                let range = IDBKeyRange.upperBound(val)
                return performReadonlyQuery(db, entityClass.name, queryableProp, range)
            },
            between(min, max): Promise<Array<TEntity>> {
                let range = IDBKeyRange.bound(min, max)
                return performReadonlyQuery(db, entityClass.name, queryableProp, range)
            }
        }
    }

    return findHaving
}

export class QueryableStore<TEntity, TIdProp extends keyof TEntity, TQueryableProps extends keyof TEntity> extends TypedStore<TEntity, TIdProp>
{

    constructor(db: TypedDB, entityClass: EntityClass<TEntity>, idProp: TIdProp, private queryableProps: Array<TQueryableProps>) {
        super(db, entityClass, idProp)
        this.findHaving = createQueryOperations(db, entityClass, queryableProps)
    }

    findHaving: QueryOperations<TEntity, TQueryableProps>
}

export default QueryableStore

/*
type StringIndexSpecifier<TEntity> = keyof TEntity & string

type FullIndexSpecifier<TEntity> = {
    prop: StringIndexSpecifier<TEntity>
    unique?: boolean 
} 

type Index<TEntity> = FullIndexSpecifier<TEntity> | StringIndexSpecifier<TEntity>

function IsFullIndexSpecifier<TEntity>(typedIndex: Index<TEntity>): typedIndex is FullIndexSpecifier<TEntity> {
    return !!(typedIndex as any).prop
}

function getIndexedProperty<TEntity>(typedIndex: Index<TEntity>): StringIndexSpecifier<TEntity> {
    return  (IsFullIndexSpecifier(typedIndex)) ? typedIndex.prop : typedIndex
}
*/
