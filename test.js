async function test() {
  const res = await fetch('http://localhost:3000/api/admin/migrate-points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
