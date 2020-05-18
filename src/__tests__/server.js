const { createServer, server, getHttpServer } = require('../server');
const path = require('path');
const fs = require('fs');
const supertest = require('supertest');
createServer(3000, path.join(__dirname, "db.yml"));

const request = supertest(server);

describe('server', () => {
  afterAll(async(done) => {
    // restore yml
    const original = fs.readFileSync(path.join(__dirname, 'original-db.yml'));
    fs.writeFileSync(path.join(__dirname, 'db.yml'), original);
    getHttpServer().close(() => {
      console.log("server closed!");
      done();
    });
  })

  test('should return products', async(done) => {
    const products = [{
      id: 1,
      name: 'tomato'
    }, {
      id: 2,
      name: 'lettuce'
    }]

    const res = await request.get('/products')
    // console.log('res',res);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(products);
    done();
  })

  test('should return a product', async(done) => {
    const product = { id: 1, name: 'tomato' };
    const res = await request.get('/products/1')
    expect(res.status).toBe(200);
    expect(res.body).toEqual(product);
    done();
  })

  test("should return 404 resource not found", async (done) => {
    const res = await request.get("/products/3");
    expect(res.status).toBe(404);
    done();
  });

  test("should return 404 resource not found", async (done) => {
    const res = await request.get("/products/3");
    expect(res.status).toBe(404);
    done();
  });

  test('should add product to /products', async(done) => {
    const createdRecord = { id: 3, name: 'cucumber' };

    const res = await request
      .post('/products')
      .send({ name : 'cucumber' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual(createdRecord)
    done();
  })

  test('should update product', async(done) => {
    const changeTo = { id : 3, name: 'gurkin' };
    let res = await request
      .put('/products')
      .send({ id: 3, name: 'gurkin' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual(changeTo);

    res = await request.get('/products/3')
    expect(changeTo).toEqual(res.body);
    done();
  })

  test('should delete product', async(done) => {
    const deletedItem = { id: 3, name: "gurkin" };
    let res = await request.delete('/products/3');
    expect(res.status).toBe(200)
    expect(res.body).toEqual(deletedItem)

    res = await request.get('/products/3');
    expect(res.status).toBe(404)
    done();
  })

})