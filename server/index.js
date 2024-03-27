require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    try {

        const querySubcategories = 'SELECT DISTINCT Категория, Подкатегория FROM База';

        db.query(querySubcategories, function (error, subcategories, fields) {

            if (error) throw error;

            const categorySubcategoriesMap = {};

            subcategories.forEach(row => {

                const category = row.Категория;
                const subcategory = row.Подкатегория;

                if (!categorySubcategoriesMap[category]) {
                    categorySubcategoriesMap[category] = [];
                }

                categorySubcategoriesMap[category].push(subcategory);
            });

            res.render('index', {
                categorySubcategoriesMap: categorySubcategoriesMap
            });
        });

    } catch (error) {
        console.error('Ошибка при загрузке начальной страницы:', error);
        res.status(500).send('Ошибка сервера');
    }
});

app.post('/filter', (req, res) => {
    try {
        const selectedValues = req.body.selectedValues;
        const searchTerm = req.body.searchTerm;

        if (!selectedValues || selectedValues.length === 0) {
            res.json({ filterData: [] });
        } else {
            db.query('SELECT Подкатегория FROM база', (error, categories) => {
                if (error) {
                    console.error('Ошибка выполнения запроса категорий:', error);
                    res.status(500).json({ message: 'Ошибка выполнения запроса' });
                } else {
                    const categoryNames = categories.map(category => category['Подкатегория']);
                    const uniqueCategoryNames = categoryNames.filter((category, index) => categoryNames.indexOf(category) === index);

                    const conditions = selectedValues.map(value => {
                        if (uniqueCategoryNames.includes(value)) {
                            return `Подкатегория = '${value}'`;
                        } else {
                            return value === 'Источник' ? `Источник = 'T'` : value === 'github' || value === 'Бесплатно' ? `Теги LIKE '%${value}%'` : `${value} = 1.0`;
                        }
                    }).join(' OR ');

                    const query = `(SELECT * FROM база WHERE ${conditions})`;

                    db.query(query, (error, results) => {
                        if (error) {
                            console.error('Ошибка выполнения запроса: ' + error);
                            res.status(500).json({ message: 'Ошибка выполнения запроса' });
                        } else {
                            if (searchTerm) {
                                results = results.filter(item => {
                                    for (const key in item) {
                                        if (item[key] && item[key].toLowerCase().includes(searchTerm.toLowerCase())) {
                                            return true;
                                        }
                                    }
                                    return false;
                                });
                            }
                            res.json({ filterData: results, uniqueCategoryNames: uniqueCategoryNames });
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.post('/service', async (req, res) => {
    try {
        const subcategory = req.query.subcategory;
        const filterData = req.body.filterData;

        const filteredResults = filterData.filter(item => item['Подкатегория'] === subcategory);
        res.render('phone', { results: filteredResults, subcategory });

    } catch (error) {

        console.error('Ошибка при загрузке сервисов:', error);
        res.status(500).send('Ошибка сервера');
    }
});

const start = async () => {
    try {
        db.connect();
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (error) {
        console.log(error)
    }
}

start()