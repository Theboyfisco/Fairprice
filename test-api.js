const http = require('http');

function get(path, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: 3000, path, method: 'GET' },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, data: d }));
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.end();
  });
}

async function main() {
  console.log('🏆 GoalLine API Integration Test\n');

  // 1. Test fixtures
  console.log('📋 /api/fixtures');
  const f = await get('/api/fixtures');
  const arr = JSON.parse(f.data);
  console.log(`   Status: ${f.status} | Fixtures: ${arr.length}`);
  const wcFixtures = arr.filter((x) => x.competitionId === 72);
  const realWC = arr.find((x) => x.homeTeam === 'Spain');
  console.log(`   World Cup fixtures: ${wcFixtures.length}`);
  console.log(`   Real WC match: ${realWC ? `✅ ${realWC.homeTeam} vs ${realWC.awayTeam} (${realWC.fixtureId})` : '❌ Not found'}`);
  
  // 2. Test real WC odds
  if (realWC) {
    console.log(`\n💰 /api/odds/${realWC.fixtureId} (Spain vs Argentina)`);
    const o = await get(`/api/odds/${realWC.fixtureId}`);
    const odds = JSON.parse(o.data);
    console.log(`   Status: ${o.status}`);
    console.log(`   Home Win: ${odds.homeWin} | Draw: ${odds.draw} | Away Win: ${odds.awayWin}`);
    console.log(`   Over 2.5: ${odds.over25} | Under 2.5: ${odds.under25}`);
    console.log(`   BTTS Yes: ${odds.bttsYes} | BTTS No: ${odds.bttsNo}`);
    
    const isReal = odds.homeWin !== 2.1; // default odds = 2.1
    console.log(`   Source: ${isReal ? '✅ Real TxLINE data' : '⚠️  Fallback mock data'}`);
  }

  // 3. Test validate endpoint
  console.log('\n🔐 /api/validate (POST)');
  const vReq = http.request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/validate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        const v = JSON.parse(d);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Has summary: ${!!v.summary}`);
        console.log(`   Has subTreeProof: ${!!v.subTreeProof}`);
        console.log(`   Fixture: ${v.summary?.fixtureId}`);
      });
    }
  );
  vReq.write(JSON.stringify({ fixtureId: 18143852, seq: 941, statKey: 1002 }));
  vReq.end();

  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n✅ All tests complete!');
}

main().catch(console.error);
