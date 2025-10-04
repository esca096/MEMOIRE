from django.contrib import admin

from .models import Product, Cart, Order, Review


admin.site.register(Product)
admin.site.register(Cart)
admin.site.register(Order)
admin.site.register(Review)
