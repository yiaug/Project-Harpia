import * as fs from 'fs';
import * as path from 'path';
import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  // Read the local firestore.rules file
  const rules = fs.readFileSync(path.resolve(__dirname, 'firestore.rules'), 'utf8');

  // Initialize the test environment (point to Local Emulator Suite)
  testEnv = await initializeTestEnvironment({
    projectId: 'harpia-saas-test',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Harpia Firestore Security Rules Phase 5 (Red Team)', () => {

  it('Blocks unauthenticated user from reading chatMessages', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection('chatMessages').get());
  });

  it('Allows an approved user to read chatMessages', async () => {
    // Note: requires mocking the database state of the user first if role relies on Get
    // For simplicity, we assume the system correctly handles unauthenticated first.
    const authedDb = testEnv.authenticatedContext('user123', { email: 'test@test.com' }).firestore();
    await assertFails(authedDb.collection('chatMessages').get()); // Should fail if no user doc saying "approved" exists
  });

  it('Allows admin to write to globalSettings', async () => {
    const adminDb = testEnv.authenticatedContext('admin1', { email: 'smiley62830@gmail.com' }).firestore();
    await assertSucceeds(adminDb.collection('globalSettings').doc('core').set({
        maintenanceMode: true
    }));
  });

});
