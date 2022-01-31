/**
 * Copyright (c) ActiveWidgets SARL. All Rights Reserved.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { response, http, params, operations, convertFilter } from "@activewidgets/options";

let ops = {
    '=': 'eq',
    '>': 'gt',
    '<': 'lt',
    '>=': 'ge',
    '<=': 'le'
};

let format = {
    compare: (path, op, value) => ({[path.join('.')]: ops[op] + '.' + value})
}


function convertSort(expr){
    if (expr){
        return expr.replace(' ', '.');
    }
}


function convertParams({limit, offset, sort, filter}){
    return Object.assign({limit, offset, order: convertSort(sort)}, convertFilter(filter, format));
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


function processResponse(res){
    
    if (!res.ok){
        throw new Error(res.statusText || res.status);
    }
    
    return res.json().then(items => {
        
        if (!Array.isArray(items)){
            return items;
        }

        return {items, count: extractCount(res.headers)};
    });
}


export function postgrest(serviceURL, fetchConfig){

    fetchConfig.headers['Prefer'] = 'count=exact';

    return [
        response(processResponse),
        http(serviceURL, fetchConfig),
        operations(defineOperations),
        params(convertParams)
    ];
}
