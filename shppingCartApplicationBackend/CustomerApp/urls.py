from django.urls import path
# from .views import CustomerProfile

# from . import views

# customer = CustomerProfile.as_view()
from CustomerApp.views.auth import (RegisterUser, LoginUser)
from CustomerApp.views.product import (CreateProduct, GetProducts, GetSpecificProduct,
    AddToCart, ProductRemoveFromCart, GetUserCartDetails)
from CustomerApp.views.orders import (CreateOrder, SearchUserOrder, GetSpecificOrderUser, UpdateUserOrder, RemovedUserOrder)
urlpatterns = [
    path("auth/register", RegisterUser.as_view(), name="auth-register"),
    path("auth/login", LoginUser.as_view(), name="auth-login"),

    # product
    path("product/product-creation", CreateProduct.as_view(), name="product-creation"),
    path("product/products", GetProducts.as_view(), name="products"),
    path("product/specif-product", GetSpecificProduct.as_view(), name="specif-product"),

    #cart
    path("product/cart/add", AddToCart.as_view(), name="cart-add"),
    path("product/cart/remove", ProductRemoveFromCart.as_view(), name="cart-remove"),
    path("product/cart/details", GetUserCartDetails.as_view(), name="cart-details"),

    # orders
    path("order/create", CreateOrder.as_view(), name="order-create"),
    path("order/search", SearchUserOrder.as_view(), name="order-search"),
    path("order/details", GetSpecificOrderUser.as_view(), name="order-details"),
    path("order/update", UpdateUserOrder.as_view(), name="order-update"),
    path("order/remove", RemovedUserOrder.as_view(), name="order-remove"),
]
