import { getSummary } from '../../src/controllers/inventoryController.js';
import dotenv from 'dotenv';

dotenv.config();

// mock req and res
const req = {
  user: {
    hospitalId: '344cc3c6-56f6-4c90-a959-b9d7b0abfd61'
  }
};

const res = {
  json: (data) => {
    console.log('SUCCESS:', JSON.stringify(data, null, 2));
    process.exit(0);
  },
  status: (code) => {
    console.log('STATUS CODE:', code);
    return {
      json: (data) => {
        console.error('ERROR DATA:', data);
        process.exit(1);
      }
    };
  }
};

async function test() {
  try {
    await getSummary(req, res);
  } catch (err) {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
  }
}

test();
