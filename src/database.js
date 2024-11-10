import postgres from 'postgres'

const sql = postgres('postgres://postgres:123@localhost:5432/QIB', { rejectUnauthorized: false }
);



export default sql 