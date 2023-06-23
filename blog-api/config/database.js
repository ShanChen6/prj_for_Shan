const Sequelize = require('sequelize');

const sequelize = new Sequelize('webBlogProject', 'codeshanchen', '3tsTran.', {
    host: '127.0.0.1',
    dialect: 'mysql',
});

// Kiểm tra kết nối
sequelize
    .authenticate()
    .then(() => {
        console.log('Connected to database successfully');
    })
    .catch((error) => {
        console.error('Error connecting to database:', error);
    });

module.exports = sequelize;
