const { Sequelize,DataTypes } = require('sequelize');


const sequelize = new Sequelize('home_maintenance', 'root', 'M@54321', {
    host: 'localhost',
    logging:false,
    dialect: 'mysql',
    // operatorsAliases: false,
  });


  sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established to database successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });



  const db = {}
  db.Sequelize=Sequelize
  db.sequelize = sequelize


  db.user_model = require('./user_model')(sequelize,DataTypes)
  db.vendor_detail = require('./vendor_detail')(sequelize,DataTypes)
  db.vendor_address = require('./vendor_address')(sequelize,DataTypes)
  db.vendor_location = require('./vendor_location')(sequelize,DataTypes)
  db.userReferCode = require('./userReferCode')(sequelize,DataTypes)
  db.category = require('./category')(sequelize,DataTypes)
  db.sub_category = require('./sub_category')(sequelize,DataTypes)





  db.vendor_detail.hasMany( db.vendor_address,{foreignKey:'vendor_id'})
  db.vendor_address.belongsTo(db.vendor_detail,{ foreignKey: 'vendor_id' })

  db.vendor_detail.hasMany( db.vendor_location,{foreignKey:'vendor_id'})
  db.vendor_location.belongsTo(db.vendor_detail,{ foreignKey: 'vendor_id' })

  db.user_model.hasMany(  db.userReferCode, { foreignKey: 'user_id' });
  db.userReferCode.belongsTo( db.user_model, { foreignKey: 'user_id' });


  db.category.hasMany(  db.sub_category, { foreignKey: 'category_id' });
  db.sub_category.belongsTo( db.category, { foreignKey: 'category_id' });






sequelize.sync({force:false})

module.exports = db