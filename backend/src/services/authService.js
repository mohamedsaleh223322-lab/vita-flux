import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getClient } from '../db/index.js';
import * as userRepo from '../repositories/userRepository.js';
import * as hospitalRepo from '../repositories/hospitalRepository.js';

export const login = async ({ email, password }) => {
  const user = await userRepo.getUserByEmail(email);
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  const token = jwt.sign(
    { userId: user.id, hospitalId: user.hospital_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  delete user.password;
  return { token, user };
};

export const register = async (data) => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Look up Governorate
    const govResult = await client.query('SELECT name FROM governorates WHERE id = $1', [data.governorateId]);
    const govName = govResult.rows[0]?.name || 'Cairo';

    // 2. Create Hospital
    const hospital = await hospitalRepo.createHospital(client, {
      name: data.hospitalName,
      governorate: govName,
      address: data.city,
      phone: data.hospitalPhone
    });

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 4. Create User
    const user = await userRepo.createUser(client, {
      hospital_id: hospital.id,
      full_name: data.fullName,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      phone: data.adminPhone,
      governorate: govName
    });

    await client.query('COMMIT');

    const token = jwt.sign(
      { userId: user.id, hospitalId: user.hospital_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    delete user.password;
    return { token, user };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    release();
  }
};
