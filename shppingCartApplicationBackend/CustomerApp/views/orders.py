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
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

dbconn = db

class CreateOrder(APIView):
    """
    API endpoint to create a new order
    POST /api/orders/create
    Payload: {
        "fkUserId": string,
        "products": [
            {
                "fkProductId": string,
                "quantity": int
            },
            {
                "fkProductId": string,
                "quantity": int
            }
        ]
    }
    """
    
    def post(self, req):
        try:
            data = loads(req.body)
            
            # Validate required fields
            if 'fkUserId' not in data or not data['fkUserId']:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'bad request user data not found'
                })
            
            if 'products' not in data or not isinstance(data['products'], list) or not data['products']:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Products required'
                })
            
            try:
                fk_user_id = ObjectId(data['fkUserId'])
                user = dbconn.clnUsers.find_one({'_id': fk_user_id, 'activeFlag': True})
                if not user:
                    return JsonResponse({
                        'statusCode': 400,
                        'message': 'bad request user data not found'
                    })
            except:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Invalid user data'
                })
            
            order_items = []
            calculated_total = 0
            
            for item in data['products']:
                if 'fkProductId' not in item or not item['fkProductId']:
                    return JsonResponse({
                        'statusCode': 400,
                        'message': 'bad request product data not found'
                    })
                
                if 'quantity' not in item or not isinstance(item['quantity'], int) or item['quantity'] < 1:
                    return JsonResponse({
                        'statusCode': 400,
                        'message': 'Quantity must be a positive integer'
                    })
                
                try:
                    fk_product_id = ObjectId(item['fkProductId'])
                    product = dbconn.Products.find_one({'_id': fk_product_id, 'activeFlag': True})
                    if not product:
                        return JsonResponse({
                            'statusCode': 400,
                            'message': 'bad request product data not found'
                        })
                    
                    # Calculate item total
                    item_total = product['price'] * item['quantity']
                    calculated_total += item_total
                    
                    order_items.append({
                        'fkProductId': fk_product_id,
                        'productName': product['name'],
                        'quantity': item['quantity'],
                        'unitPrice': product['price'],
                        'totalPrice': item_total
                    })
                    
                except:
                    return JsonResponse({
                        'statusCode': 400,
                        'message': f'Invalid product data: {item["fkProductId"]}'
                    })

            delivery_charge = 50.00 
            subtotal = calculated_total
            tax_percentage = 0.05
            tax_amount = round(subtotal * tax_percentage, 2)
            final_total = subtotal + delivery_charge + tax_amount
            last_order = dbconn.Orders.find_one(
                {}, sort=[("createdOn", -1)], projection={"orderNumber": 1}
            )
            if last_order and "orderNumber" in last_order and str(last_order["orderNumber"]).startswith("ON"):
                try:
                    last_num = int(str(last_order["orderNumber"])[2:])
                except Exception:
                    last_num = 0
                next_num = last_num + 1
            else:
                next_num = 1
            while True:
                orderNumber = f"ON{next_num:05d}"
                duplicate = dbconn.Orders.find_one({"orderNumber": orderNumber})
                if not duplicate:
                    break
                next_num += 1

            order = {
                'fkUserId': fk_user_id,
                'items': order_items,
                'subtotal': subtotal,
                'deliveryCharge': delivery_charge,
                'taxPercentage': tax_percentage * 100,
                'taxAmount': tax_amount,
                'totalPrice': final_total,
                'orderNumber': orderNumber,
                'status': 'pending',
                'createdOn': datetime.now(),
                'activeFlag': True,
                'isInactive': False
            }
            
            # Insert order
            result = dbconn.Orders.insert_one(order)
            order_id = str(result.inserted_id)
            return JsonResponse({
                'statusCode': 200,
                'message': 'Order created successfully',
                'data': {
                    'orderId': order_id,
                    'fkUserId': str(fk_user_id),
                    'items': [
                        {
                            'fkProductId': str(item['fkProductId']),
                            'productName': item['productName'],
                            'quantity': item['quantity'],
                            'unitPrice': item['unitPrice'],
                            'totalPrice': item['totalPrice']
                        } for item in order_items
                    ],
                    'subtotal': subtotal,
                    'deliveryCharge': delivery_charge,
                    'taxPercentage': tax_percentage * 100,
                    'taxAmount': tax_amount,
                    'totalPrice': final_total,
                    'status': 'pending'
                }
            })
            
        except Exception as e:
            print(format_exc())
            return JsonResponse({
                'statusCode': 500,
                'message': 'Internal server error'
            })


@method_decorator(csrf_exempt, name='dispatch')
class SearchUserOrder(APIView):
    """
    Search orders by orderNumber or customer name and optional status filter
    POST /api/product/order/search
    Payload: {
        status
    }
    """
    def post(self, req):
        try:
            data = loads(req.body)
            query_str = data.get('query', '')
            status = data.get('status')

            base_query = {'activeFlag': True, 'isInactive': False}
            if status:
                base_query['status'] = status

            # If query provided, search orderNumber and user name
            if query_str:
                user_ids = []
                try:
                    users = list(dbconn.clnUsers.find({'name': {'$regex': query_str, '$options': 'i'}, 'activeFlag': True}))
                    user_ids = [u['_id'] for u in users]
                except Exception:
                    user_ids = []

                or_clauses = [{'orderNumber': {'$regex': query_str, '$options': 'i'}}]
                if user_ids:
                    or_clauses.append({'fkUserId': {'$in': user_ids}})

                base_query['$or'] = or_clauses

            orders = list(dbconn.Orders.find(base_query).sort('createdOn', -1))

            result = []
            for o in orders:
                item = o.copy()
                item['_id'] = str(item['_id'])
                item['fkUserId'] = str(item['fkUserId']) if 'fkUserId' in item else None
                if 'createdOn' in item:
                    try:
                        item['createdOn'] = item['createdOn'].isoformat()
                    except Exception:
                        item['createdOn'] = str(item['createdOn'])
                if 'items' in item and isinstance(item['items'], list):
                    for it in item['items']:
                        if 'fkProductId' in it:
                            it['fkProductId'] = str(it['fkProductId'])
                try:
                    user = dbconn.clnUsers.find_one({'_id': ObjectId(item['fkUserId'])}) if item.get('fkUserId') else None
                    if user and 'name' in user:
                        item['customerName'] = user['name']
                except Exception:
                    pass

                result.append(item)

            return JsonResponse({
                'statusCode': 200,
                'message': 'Cart items retrieved successfully',
                'data': result,
                'count': len(result)
            })
        except Exception as e:
            print(format_exc())
            return JsonResponse({'statusCode': 500, 'message': 'Internal server error'})


@method_decorator(csrf_exempt, name='dispatch')
class GetSpecificOrderUser(APIView):
    """
    Get a specific order by _id
    POST /api/product/order/details
    Payload: { "_id": string }
    """
    def post(self, req):
        try:
            data = loads(req.body)
            if '_id' not in data or not data['_id']:
                return JsonResponse({'statusCode': 400, 'message': 'bad request! product order not found'})
            
            order = dbconn.Orders.find_one({'_id': ObjectId(data['_id']), 'activeFlag': True, 'isInactive': False})
            if not order:
                return JsonResponse({'statusCode': 404, 'message': 'Order not found'})

            order['_id'] = str(order['_id'])
            try:
                if 'fkUserId' in order and order.get('fkUserId'):
                    user_doc = dbconn.clnUsers.find_one({'_id': order['fkUserId']})
                    if user_doc and 'name' in user_doc:
                        order['customerName'] = user_doc['name']
            except Exception:
                pass

            order['fkUserId'] = str(order['fkUserId']) if 'fkUserId' in order else None
            if 'createdOn' in order:
                try:
                    order['createdOn'] = order['createdOn'].isoformat()
                except Exception:
                    order['createdOn'] = str(order['createdOn'])
            if 'items' in order:
                for it in order['items']:
                    if 'fkProductId' in it:
                        it['fkProductId'] = str(it['fkProductId'])

            return JsonResponse({'statusCode': 200, 'message': 'Order retrieved successfully', 'data': order})
        except Exception:
            print(format_exc())
            return JsonResponse({'statusCode': 500, 'message': 'Internal server error'})


@method_decorator(csrf_exempt, name='dispatch')
class UpdateUserOrder(APIView):
    """
    Update order status
    POST /api/product/order/update
    Payload: { "_id":string, "status": string }
    """
    def post(self, req):
        try:
            data = loads(req.body)
            if '_id' not in data or not data['_id']:
                return JsonResponse({'statusCode': 400, 'message': 'Order ID is required'})
            if not ObjectId.is_valid(data['_id']):
                return JsonResponse({'statusCode': 400, 'message': 'Invalid order ID format'})
            if 'status' not in data or not data['status']:
                return JsonResponse({'statusCode': 400, 'message': 'status not selected.'})

            order_id = ObjectId(data['_id'])
            existing = dbconn.Orders.find_one({'_id': order_id})
            if not existing:
                return JsonResponse({'statusCode': 400, 'message': 'bad request! Order not found'})

            result = dbconn.Orders.update_one({'_id': order_id}, {'$set': {'status': data['status'], 'updatedOn': datetime.now()}})
            if result.modified_count > 0:
                return JsonResponse({'statusCode': 200, 'message': 'Order status updated successfully', 'data': {'orderId': data['_id'], 'status': data['status']}})
            else:
                return JsonResponse({'statusCode': 400, 'message': 'No changes made to the order'})
        except Exception:
            print(format_exc())
            return JsonResponse({'statusCode': 500, 'message': 'Internal server error'})


@method_decorator(csrf_exempt, name='dispatch')
class RemovedUserOrder(APIView):
    """
    Soft-remove an order by user
    POST /api/order/remove
    Payload: {_id:string}
    """
    def post(self, req):
        try:
            data = loads(req.body)
            if '_id' not in data or not data['_id']:
                return JsonResponse({'statusCode': 400, 'message': 'Order is required'})

            order_id = ObjectId(data['_id'])
            existing = dbconn.Orders.find_one({'_id': order_id, 'activeFlag': True, 'isInactive': False})
            if not existing:
                return JsonResponse({'statusCode': 400, 'message': 'bad request! Order not found'})

            result = dbconn.Orders.update_one(
                {'_id': order_id},
                {'$set': {'activeFlag': False, 'isInactive': True, 'updatedOn': datetime.now()}}
            )

            if result.modified_count > 0:
                return JsonResponse({'statusCode': 200, 'message': 'Order removed successfully'})
            else:
                return JsonResponse({'statusCode': 400, 'message': 'Failed to remove order'})

        except Exception:
            print(format_exc())
            return JsonResponse({'statusCode': 500, 'message': 'Internal server error'})


