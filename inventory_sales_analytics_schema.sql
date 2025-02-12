INSERT INTO sales_analytics (report_date, category_id, total_sales, total_quantity, total_cost, total_expenses)
SELECT 
    CURDATE() AS report_date,
    p.category_id,
    SUM(s.total_amount) AS total_sales,
    SUM(s.quantity) AS total_quantity,
    SUM(s.quantity * p.cost) AS total_cost,
    COALESCE(SUM(e.amount), 0) AS total_expenses
FROM sales s
JOIN products p ON s.product_id = p.id
LEFT JOIN expenses e ON e.product_id = p.id
GROUP BY p.category_id;

