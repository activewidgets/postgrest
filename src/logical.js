/**
 * Copyright (c) ActiveWidgets SARL. All Rights Reserved.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function merge(key, value){
    return `${key}${key == 'and' || key == 'or' ? '' : '.'}${value}`;
}

export function logical(operator, items){

    if (operator != 'not'){
        return {[operator]: `(${items.map(expr => Object.keys(expr).map(k => merge(k, expr[k])))})`};
    }

    let key = Object.keys(items)[0],
        value = items[key];

    return (key == 'and' || key == 'or') ? {[`not.${key}`]: value} : {[key]: `not.${value}`};
}
