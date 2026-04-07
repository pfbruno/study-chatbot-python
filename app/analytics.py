from app.database import get_all_interactions


def total_questions():
    data = get_all_interactions()
    return len(data)


def questions_by_category():
    data = get_all_interactions()
    category_count = {}

    for row in data:
        category = row[2]
        category_count[category] = category_count.get(category, 0) + 1

    return category_count


def most_frequent_category():
    category_count = questions_by_category()

    if not category_count:
        return None

    return max(category_count, key=category_count.get)