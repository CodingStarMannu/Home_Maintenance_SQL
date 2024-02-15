
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {

const vendor_Locations = sequelize.define('vendor_Locations', {
    vendor_Locations_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
  latitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: false,
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
return vendor_Locations;

}

