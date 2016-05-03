//app/components/Recipes.jsx

import React from 'react';
import Recipe from './Recipe.jsx';
import uuid from 'node-uuid';
import {Modal} from 'react-bootstrap';
import {Button} from 'react-bootstrap';
import {Input} from 'react-bootstrap';

export default ({recipes, onDelete}) => {
	return (
		<div className="recipeList">
			<ul>
				{recipes.map(recipe =>
					<Recipe key={recipe.id} name={recipe.name} onDelete={onDelete.bind(null, recipe.id)} />
				)}
			</ul>
		</div>
	)
}