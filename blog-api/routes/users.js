const express = require('express');
const router = express.Router();
const sequelize = require('../config/database'); // Import kết nối cơ sở dữ liệu
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
let isLoggedIn = false; // Khởi tạo cờ đăng nhập


// Tạo tài khoản admin sẵn có
const createAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);

      const adminUser = await User.create({
        username: 'admin',
        password: hashedPassword,
        fullName: 'Admin',
        age: 30,
        address: 'Admin Address',
        gender: 'male',
        isAdmin: true
      });

      console.log('Admin user created:', adminUser);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Gọi hàm tạo tài khoản admin khi ứng dụng khởi động
createAdminUser();

// Gán quyền admin cho người dùng đã đăng kí
router.patch('/users/:id/admin', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cập nhật trường isAdmin thành true
    user.isAdmin = true;
    await user.save();

    res.json({ message: 'User has been granted admin role' });
  } catch (error) {
    console.error('Error granting admin role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/* GET users listing. */
router.get('/', async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Lỗi truy vấn:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
});


// Đăng ký người dùng mới
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, fullName, age, address, gender } = req.body;

    // Kiểm tra xem người dùng đã tồn tại hay chưa
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Username already exists'
      });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const createdUser = await User.create({
      username,
      password: hashedPassword, // Sử dụng mật khẩu đã được hash
      fullName,
      age,
      address,
      gender
    });

    res.json({
      status: 'success',
      message: 'User registered successfully',
      data: createdUser
    });
  } catch (error) {
    console.error('Lỗi đăng ký người dùng:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user',
      error: error.message
    });
  }
});


// API endpoint để get user theo ID
router.get('/:id', async (req, res, next) => {
  try {
    // Lấy ID người dùng từ URL
    const userId = req.params.id;

    // Thực hiện logic để lấy thông tin người dùng từ cơ sở dữ liệu hoặc nguồn dữ liệu khác
    // Sử dụng Sequelize ORM
    const user = await User.findByPk(userId);

    if (!user) {
      // Nếu không tìm thấy người dùng, trả về lỗi 404 Not Found
      return res.status(404).json({ error: 'User not found' });
    }

    // Trả về thông tin người dùng
    return res.json(user);
  } catch (error) {
    // Xử lý lỗi nếu có
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// API endpoint để xử lý đăng nhập
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra xem người dùng có tồn tại hay không
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // So sánh mật khẩu được cung cấp với mật khẩu đã hash trong cơ sở dữ liệu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Tạo JWT với thông tin người dùng
    // Tạo JSON Web Token (JWT)
    const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';
    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '7D' });

    isLoggedIn = true; // Đặt cờ đăng nhập thành true

    // Trả về JWT cho người dùng
    return res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName
        },
        expiresIn: '604800'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// API endpoint để xử lí đăng xuất
router.post('/logout', (req, res, next) => {
  if (!isLoggedIn) {
    // Kiểm tra cờ đăng nhập, nếu chưa đăng nhập trả về lỗi
    return res.status(401).json({ error: 'User is not logged in' });
  }

  // Xóa token khỏi phía máy khách bằng cách gửi lại một cookie đã hết hạn
  res.cookie('token', '', { expires: new Date(0) }).json({ message: 'Logged out successfully' });

  isLoggedIn = false; // Đặt cờ đăng nhập thành false
});


// API endpoint để cập nhật thông tin người dùng
router.patch('/profile/:id', async (req, res, next) => {

});

module.exports = router;
