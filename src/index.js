/**
 * Copyright (c) ActiveWidgets SARL. All Rights Reserved.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { http, params, operations, data, convertSort, convertFilter } from "@activewidgets/options";
import {logical} from './logical.js';

const operators = {

    /* equality */
    '=': 'eq',
    '<>': 'neq',
    '!=': 'neq',

    /* comparison */
    '<': 'lt',
    '>': 'gt',
    '<=': 'lte',
    '>=': 'gte',

    /* text */
    'LIKE': 'like',
    'ILIKE': 'ilike',

    /* logical */
    'NOT': 'not',
    'AND': 'and',
    'OR': 'or'
};

const formatting = {
    equality: (name, operator, value) => ({[name]: `${operator}.${value}`}),
    comparison: (name, operator, value) => ({[name]: `${operator}.${value}`}),
    text: (name, operator, pattern) => ({[name]: `${operator}.${pattern.replace(/%/g, '*')}`}),
    logical: (operator, expression) => logical(operator, expression)
};

function sortExpr(name, direction){
    return `${name}.${direction}`;
}

function mergeAll(items){
    return items.join();
}

function convertParams({where, orderBy, limit, offset}){

    let params = {
        order: convertSort(orderBy, sortExpr, mergeAll, '.'),
        limit, 
        offset 
    };

    return Object.assign(params, convertFilter(where, operators, formatting, '.'));
}


function encode(id, pk){

    if (typeof pk == 'string'){
        return new URLSearchParams({[pk]: `eq.${id}`});
    }

    if (Array.isArray(pk)){
        let params = Object.assign({}, ...pk.map((col, i)=>({[col]: `eq.${id[i]}`})));
        return new URLSearchParams(params);
    }

    throw new Error('Identity not defined or wrong type');
}


function defineOperations(url, send, pk){

    function insertRow(data){
        return send(url, {method: 'POST', body: JSON.stringify(data)})
    }

    function updateRow(id, data){
        return send(`${url}?${encode(id, pk)}`, {method: 'PATCH', body: JSON.stringify(data)})
    }

    function deleteRow(id){
        return send(`${url}?${encode(id, pk)}`, {method: 'DELETE'});
    }

    return {insertRow, updateRow, deleteRow};
}


function extractCount(headers){

    let range = headers.get('Content-Range') || '',
        count = range.split('/')[1];

    return count == '*' ? undefined : Number(count);
}


function convertData(items, res){
    
    if (!Array.isArray(items)){
        return items;
    }

    return {items, count: extractCount(res.headers)};
}


export function postgrest(serviceURL, fetchConfig = {}){

    fetchConfig.headers = fetchConfig.headers || {};
    fetchConfig.headers['Prefer'] = 'count=exact';

    return [
        http(serviceURL, fetchConfig),
        operations(defineOperations),
        params(convertParams),
        data(convertData)
    ];
}
