type Without<TEntity, TExclude> = Pick<TEntity, Exclude<keyof TEntity, keyof TExclude>>;

interface DslOne<TExclude> {
    one: TestDsl<TExclude & DslOne<TExclude>>
}

interface DslTwo<TExclude> {
    twoRepeatable: TestDsl<TExclude> // & DslTwo<TExclude>>
}

interface DslThree<TExclude> {
    three: TestDsl<TExclude & DslThree<TExclude>>
}

type TestDsl<TExclude> = Without<DslOne<TExclude> & DslTwo<TExclude> & DslThree<TExclude>, TExclude>

let test: TestDsl<{}>
