def paginate(queryset, page, limit):
    page = max(int(page), 1)
    limit = max(int(limit), 1)
    skip = (page - 1) * limit
    items = list(queryset.skip(skip).limit(limit))
    total = queryset.count()
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }
