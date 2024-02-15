var db = require('../models/index')
var userModels = db.user_model
var vendor_detail = db.vendor_detail
var category = db.category

var sub_category = db.sub_category




const getAllUsers = async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await userModels.findAll();
  
      return res.status(200).json({ message: 'Users retrieved successfully.', data: users });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error getting users.' });
    }
  };


  const getAllvendor = async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await vendor_detail.findAll();
  
      return res.status(200).json({ message: 'Users retrieved successfully.', data: users });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error getting users.' });
    }
  };


  const add_categories = async (req, res) => {
    try {
      const { category_name,  description } = req.body;

  
      // Check if the category already exists (case-insensitive)
      const existingCategory = await category.findOne({
        where: {
            category_name:  category_name
        },
      });
  
      if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists.' });
      }
  
      // Create a new category in the database
      const newCategory = await category.create({
        category_name,
        description,
      });
  
      return res.status(201).json({ message: 'Category created', data: newCategory });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Error creating category.' });
    }
  };

  
  const get_category = async (req, res) => {
    try {
      const categoryId = req.params.category_id; // Assuming you pass the category ID in the URL parameter "category_id"
  
      // Fetch the category from the database
      const categoryData = await category.findByPk(categoryId);
  
      if (!categoryData) {
        return res.status(404).json({ message: 'Category not found.' });
      }
  
      // Count the number of products in the category  
      return res.status(200).json({ data: categoryData });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: 'Error fetching category.' });
    }
  };
  
  const get_all_categories = async (req,res) => {
    try {
        const allCategories = await category.findAll();
        if (!allCategories || allCategories.length === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        return res.status(200).json({ data: allCategories });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching category.' });
    }
};


  const update_category = async (req, res) => {
    try {
      const { category_name, description } = req.body;
      const categoryId = req.body.category_id; 
      const imageUrl = req.file ? req.file.filename : null; 
  
      const existingCategory = await category.findByPk(categoryId);
  
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found.' });
      }
  
      await category.update(
        {
          category_name,
          image: imageUrl ? imageUrl : existingCategory.image,
          description,
        },
        {
          where: { category_id: categoryId },
        }
      );
  
      return res.status(200).json({ message: 'Category updated successfully.' });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Error updating category.' });
    }
  };

  const delete_category = async (req, res) => {
    try {
      const categoryId = req.body.category_id; // Assuming you pass the category ID in the URL parameter "id"
  
      // Check if the category exists
      const existingCategory = await category.findByPk(categoryId);
  
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found.' });
      }
  
      // Delete the category from the database
      await category.destroy({
        where: { category_id: categoryId },
      });
  
      return res.status(200).json({ message: 'Category deleted successfully.' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Error deleting category.' });
    }
  };

 // Add Subcategory
const addSubcategory = async (req, res) => {
    try {
        const { category_id, subcategory_name, description } = req.body;

        // Check if the subcategory already exists (case-insensitive)
        const existingSubcategory = await sub_category.findOne({
            where: {
                subcategory_name: subcategory_name
            },
        });

        if (existingSubcategory) {
            return res.status(400).json({ message: 'Subcategory already exists.' });
        }

        // Create a new subcategory in the database
        const newSubcategory = await sub_category.create({
            category_id,
            subcategory_name,
            description,
        });

        return res.status(201).json({ message: 'Subcategory created', data: newSubcategory });
    } catch (error) {
        console.error('Error creating subcategory:', error);
        res.status(500).json({ message: 'Error creating subcategory.' });
    }
};

// Get Subcategory
const getSubcategory = async (req, res) => {
    try {
        const subcategoryId = req.params.id;
        const foundSubcategory = await sub_category.findByPk(subcategoryId);
        if (!foundSubcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        return res.status(200).json({ data: foundSubcategory });
    } catch (error) {
        console.error('Error retrieving subcategory:', error);
        res.status(500).json({ message: 'Error retrieving subcategory.' });
    }
};

// Update Subcategory
const updateSubcategory = async (req, res) => {
    try {
        const subcategoryId = req.params.id;
        const updatedData = req.body;

        const foundSubcategory = await sub_category.findByPk(subcategoryId);
        if (!foundSubcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        await foundSubcategory.update(updatedData);
        return res.status(200).json({ message: 'Subcategory updated', data: foundSubcategory });
    } catch (error) {
        console.error('Error updating subcategory:', error);
        res.status(500).json({ message: 'Error updating subcategory.' });
    }
};

// Delete Subcategory
const deleteSubcategory = async (req, res) => {
    try {
        const subcategoryId = req.params.id;
        const deletedSubcategory = await sub_category.destroy({
            where: {
                category_id: subcategoryId
            }
        });
        if (!deletedSubcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        return res.status(200).json({ message: 'Subcategory deleted' });
    } catch (error) {
        console.error('Error deleting subcategory:', error);
        res.status(500).json({ message: 'Error deleting subcategory.' });
    }
};



  module.exports = {getAllUsers,getAllvendor, add_categories,update_category,get_category,delete_category,get_all_categories,
    addSubcategory,getSubcategory,updateSubcategory,deleteSubcategory}