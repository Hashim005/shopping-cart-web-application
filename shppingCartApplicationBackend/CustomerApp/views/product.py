from json import loads
import json
from re import match as re_match
from django.http import JsonResponse
from datetime import datetime
from traceback import format_exc
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
import base64
import os
from bson.objectid import ObjectId
from django.conf import settings
from zerasBurgerBackend.mongoConnection import db

dbconn = db


class CreateProduct(APIView):
    """
    API endpoint to create a new product
    POST /api/products/add
    """
    # permission_classes = [IsAuthenticated]  # Enable this for production
    
    def post(self, req):
        try:
            # Parse request body
            data = loads(req.body)

            required_fields = ['name', 'description', 'price', 'imageUrl']
            
            # Validate required fields
            for field in required_fields:
                if field not in data or data[field] in ['', None]:
                    return JsonResponse({
                        'statusCode': 400,
                        'message': f'Bad request, {field} not found or empty'
                    })
            
            # Validate name
            name = data['name'].strip()
            if len(name) < 3:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Product name must be at least 3 characters long'
                })
            
            if len(name) > 100:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Product name must not exceed 100 characters'
                })
            
            # Validate description
            description = data['description'].strip()
            if len(description) < 10:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Description must be at least 10 characters long'
                })

            try:
                price = float(data['price'])
                if price <= 0:
                    return JsonResponse({
                        'statusCode': 400,
                        'message': 'Price must be a positive number'
                    }, status=400)
            except (ValueError, TypeError):
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Invalid price format. Must be a number'
                })
            
            # Handle image upload
            image_url = ''
            image_data = data['imageUrl']
            
            if image_data.startswith('data:image'):
                try:
                    # Use regex to properly extract format and base64 data
                    # Expected format: data:image/jpeg;base64,/9j/4AAQ...
                    pattern = r'data:image/(\w+);base64,(.+)'
                    match = re_match(pattern, image_data)
                    
                    if not match:
                        return JsonResponse({
                            'statusCode': 400,
                            'message': 'Invalid base64 image format. Expected: data:image/[type];base64,[data]'
                        })

                    file_ext = match.group(1).lower()
                    base64_data = match.group(2)
                    
                    # Normalize extension
                    if file_ext == 'jpeg':
                        file_ext = 'jpg'

                    allowed_exts = ['jpg', 'png', 'gif', 'webp']
                    if file_ext not in allowed_exts:
                        return JsonResponse({
                            'statusCode': 400,
                            'message': f'Image format "{file_ext}" not supported. Allowed: {", ".join(allowed_exts)}'
                        })
                    
                    # Decode base64 data
                    try:
                        image_bytes = base64.b64decode(base64_data)
                    except Exception as decode_error:
                        return JsonResponse({
                            'statusCode': 400,
                            'message': 'Invalid base64 image data. Could not decode.'
                        })
                    
                    # Check file size (5MB max)
                    file_size_mb = len(image_bytes) / (1024 * 1024)
                    if file_size_mb > 5:
                        return JsonResponse({
                            'statusCode': 400,
                            'message': f'Image size ({file_size_mb:.2f}MB) exceeds 5MB limit'
                        })
                    
                    # Generate unique filename
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
                    product_name_slug = ''.join(
                        char for char in name[:30] if char.isalnum() or char.isspace()
                    ).replace(' ', '_').lower()
                    
                    if not product_name_slug:
                        product_name_slug = 'product'
                    
                    filename = f"product_{product_name_slug}_{timestamp}.{file_ext}"
                    
                    # Create media directory
                    media_dir = os.path.join(settings.BASE_DIR, 'media', 'products')
                    os.makedirs(media_dir, exist_ok=True)
                    
                    # Save file
                    file_path = os.path.join(media_dir, filename)
                    with open(file_path, 'wb') as f:
                        f.write(image_bytes)
                    
                    # Set relative URL
                    image_url = f'/media/products/{filename}'
     
                except Exception as img_error:
                    print(format_exc())
                    return JsonResponse({
                        'statusCode': 500,
                        'message': f'Image upload failed: {str(img_error)}'
                    })
                    
            elif image_data.startswith('http://') or image_data.startswith('https://'):
                image_url = image_data  
            else:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Invalid image format. Must be base64 data URL or HTTP(S) URL'
                })
            
            product_data = {
                'name': name,
                'description': description,
                'price': round(price, 2),
                'imageUrl': image_url,
                'createdOn': datetime.now(),
                "activeFlag": True,
                "isInactive": False,
            }
            
            result = dbconn.Products.insert_one(product_data)
        
            product_data['_id'] = str(result.inserted_id)
            product_data['createdOn'] = product_data['createdOn'].isoformat()
            
            return JsonResponse({
                'statusCode': 201,
                'message': 'Product created successfully',
                'data': product_data
            })
                  
        except Exception as e:
            print(format_exc())
            return JsonResponse({
                'statusCode': 500,
                'message': f'Internal server error: {str(e)}'
            })
        

class GetProducts(APIView):
    """
    API endpoint to get all products
    GET /api/products
    """
    
    def get(self, req):
        try:
            query = {'isInactive': False, 'activeFlag': True}
            
            products = list(dbconn.Products.find(query))
            
            for product in products:
                product['_id'] = str(product['_id'])
                if 'createdOn' in product:
                    product['createdOn'] = product['createdOn'].isoformat()
            return JsonResponse({
                'statusCode': 200,
                'message': 'Products retrieved successfully',
                'data': products,
                'count': len(products)
            })
            
        except Exception as e:
            print(format_exc())
            return JsonResponse({
                'statusCode': 500,
                'message': 'Internal server error'
            })
class GetSpecificProduct(APIView):
    """
    API endpoint to get a single product by ID
    """
    
    def post(self, req):
        try:
            data = loads(req.body)
            
            if '_id' not in data or not data['_id']:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Product ID is required'
                }, status=400)
             
            product = dbconn.Products.find_one({'_id': ObjectId(data['_id'])})
            
            if not product:
                return JsonResponse({
                    'statusCode': 404,
                    'message': 'Product not found'
                }, status=404)
            
            product['_id'] = str(product['_id'])
            if 'createdOn' in product:
                product['createdOn'] = product['createdOn'].isoformat()
            
            return JsonResponse({
                'statusCode': 200,
                'message': 'Product retrieved successfully',
                'data': product
            })
            
        except Exception as e:
            print(format_exc())
            return JsonResponse({
                'statusCode': 500,
                'message': 'Internal server error'
            })

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class AddToCart(APIView):
    """
    API endpoint to add a product to user's cart
    POST /api/cart/add
    Payload: {
        "fkUserId": string,
        "fkProductId": string
    }
    """
    
    def post(self, req):
        try:
            data = loads(req.body)
            
            if 'fkUserId' not in data or not data['fkUserId']:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'User required'
                })
            
            if 'fkProductId' not in data or not data['fkProductId']:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Product is required'
                })
            
            fk_user_id = ObjectId(data['fkUserId'])
            fk_product_id = ObjectId(data['fkProductId'])
            
            user = dbconn.clnUsers.find_one({'_id': fk_user_id, 'activeFlag': True})
            if not user:
                return JsonResponse({
                    'statusCode': 404,
                    'message': 'User not found'
                })
            
            product = dbconn.Products.find_one({'_id': fk_product_id, 'activeFlag': True})
            if not product:
                return JsonResponse({
                    'statusCode': 404,
                    'message': 'Product not found'
                })
            
            quantity = data.get('quantity', 1)
            
            if not isinstance(quantity, int) or quantity < 1:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Quantity must be a positive integer'
                })
            unit_price = product['price']
            
            total_price = quantity * unit_price
            
            existing_cart_item = dbconn.Cart.find_one({
                'fkUserId': fk_user_id,
                'fkProductId': fk_product_id,
                'activeFlag': True
            })
            
            if existing_cart_item:
                new_quantity = existing_cart_item.get('quantity', 1) + quantity
                new_total_price = new_quantity * unit_price
                
                dbconn.Cart.update_one(
                    {'_id': existing_cart_item['_id']},
                    {
                        '$set': {
                            'quantity': new_quantity,
                            'unitPrice': unit_price,
                            'totalPrice': new_total_price,
                            'updatedOn': datetime.now()
                        }
                    }
                )
                
                cart_item_id = str(existing_cart_item['_id'])
                message = f'Product quantity updated in cart. New quantity: {new_quantity}'
                return_quantity = new_quantity
                return_total_price = new_total_price

            else:
                cart_item = {
                    'fkUserId': fk_user_id,
                    'fkProductId': fk_product_id,
                    'productName': product['name'],
                    'productPrice': product['price'],
                    'productImageUrl': product['imageUrl'],
                    'unitPrice': unit_price,
                    'quantity': quantity,
                    'totalPrice': total_price,
                    'createdOn': datetime.now(),
                    'activeFlag': True,
                    'isInactive': False
                }
                
                result = dbconn.Cart.insert_one(cart_item)
                cart_item_id = str(result.inserted_id)
                message = 'Product added to cart successfully'
                return_quantity = quantity
                return_total_price = total_price
            
            return JsonResponse({
                'statusCode': 200,
                'message': message,
                'data': {
                    'cartItemId': cart_item_id,
                    'fkUserId': str(fk_user_id),
                    'fkProductId': str(fk_product_id),
                    'productName': product['name'],
                    'unitPrice': unit_price,
                    'quantity':return_quantity,
                    'totalPrice': return_total_price

                }
            })
            
        except Exception as e:
            print(format_exc())
            return JsonResponse({
                'statusCode': 500,
                'message': 'Internal server error'
            })


@method_decorator(csrf_exempt, name='dispatch')
class ProductRemoveFromCart(APIView):
    """
    API endpoint to remove a product from user's cart
    POST /api/product/cart/remove
    Payload: {
        "cartItemId": string
    }
    """
    
    def post(self, req):
        try:
            data = loads(req.body)
            
            if 'cartItemId' not in data or not data['cartItemId']:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Cart Item required'
                })
            
            cart_item_id = ObjectId(data['cartItemId'])
            cart_item = dbconn.Cart.find_one({'_id': cart_item_id})
            if not cart_item:
                return JsonResponse({
                    'statusCode': 404,
                    'message': 'Cart item not found'
                })
            
            result = dbconn.Cart.update_one(
                {'_id': cart_item_id},
                {
                    '$set': {
                        'activeFlag': False,
                        'isInactive': True,
                        'updatedOn': datetime.now()
                    }
                }
            )
            
            if result.modified_count > 0:
                return JsonResponse({
                    'statusCode': 200,
                    'message': 'Product removed from cart successfully',
                    'data': {
                        'cartItemId': data['cartItemId']
                    }
                })
            else:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Failed to remove product from cart'
                })
            
        except Exception as e:
            print(format_exc())
            return JsonResponse({
                'statusCode': 500,
                'message': 'Internal server error'
            })
# @method_decorator(csrf_exempt, name='dispatch')
class GetUserCartDetails(APIView):
    """
    API endpoint to get all active cart items for a user
    POST /api/product/cart/details
    Payload: {
        "fkUserId": "68fb80cafe953b99976e7c61"
    }
    """
    def post(self, req):
        try:
            data = loads(req.body)
            if 'fkUserId' not in data or not data['fkUserId']:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'bad request! user data not found'
                })
            fk_user_id = ObjectId(data['fkUserId'])
            query = {
                'fkUserId': fk_user_id,
                'activeFlag': True,
                'isInactive': False
            }
            cart_items = list(dbconn.Cart.find(query))
            for item in cart_items:
                item['_id'] = str(item['_id'])
                item['fkUserId'] = str(item['fkUserId'])
                item['fkProductId'] = str(item['fkProductId'])
                if 'createdOn' in item:
                    item['createdOn'] = item['createdOn'].isoformat() if hasattr(item['createdOn'], 'isoformat') else str(item['createdOn'])
            return JsonResponse({
                'statusCode': 200,
                'message': 'Cart items retrieved successfully',
                'data': cart_items,
                'count': len(cart_items)
            })
        except Exception as e:
            print(format_exc())
            return JsonResponse({
                'statusCode': 500,
                'message': 'Internal server error'
            })
