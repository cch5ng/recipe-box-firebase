//app/components/Recipe.jsx

import React from 'react';
import {Modal} from 'react-bootstrap';
import {Button} from 'react-bootstrap';
import {Input} from 'react-bootstrap';
import Rebase from 're-base';
import uuid from 'node-uuid';

var base = Rebase.createClass('https://recipe-keeper.firebaseio.com/web/data');
var recipesRef = new Firebase("https://recipe-keeper.firebaseio.com/recipes");
var stepsEditStr = '';

export default class Recipe extends React.Component {

	constructor(props) {
		super(props);

		let stepsStr = this.convertStepsObjToString(this.props.steps);

		this.state = {
			isOpen: false,
			name: this.props.name,
			//key: curKey,
			ingredients: this.props.ingredients,
			steps: this.props.steps,
			stepsStr: stepsStr
		}
	}

	render() {
		var name = this.props.name;
		const onDelete = this.props.onDelete;

		//using the recipe name as a unique identifier to set className and accordion display state
		let classStr, classStrOutter;
		(this.state.isOpen) ? classStr = this.concatName() + ' padding' : classStr = this.concatName() + ' padding hidden';
		(name) ? classStrOutter = 'recipe clear' : classStrOutter = 'recipe clear hidden';

		let nameStr = this.props.name;
		var ingreds = this.state.ingredients;
		var ingredsAr = [];
		if (typeof ingreds === 'object') {
			for (var ing in ingreds) {
				ingredsAr.push(ingreds[ing]);
			}
		}
		var ingredientNodes = ingredsAr.map(function(ingred, idx) {
			return (
				<div className="ingredient" key={ingred} >
					{ingred}
				</div>
			);
		});

//refactor this is a bit redundant with ingredients
		var steps = this.state.steps;
		console.log('steps from db: ' + steps);
		console.log('typeof steps from db: ' + typeof steps);
		var stepsAr = [];
		if (typeof steps === 'object') {
			for (var step in steps) {
				stepsAr.push(steps[step]);
			}
		}
		var stepNodes = stepsAr.map(function(step, idx) {
			let keyStr = uuid.v1();
			//let keyStr = trimSpaces(nameStr) + 'Ing' + idx;
			return (
				<div className="ingredient" key={keyStr} >
					{step}
				</div>
			);
		});
//reusing below
		stepsAr.forEach(function(step) {
			stepsEditStr += step + '\n';
		})


		return (
			<div className={classStrOutter} key={this.state.key}>
				<p className="h4" onClick={this.toggleIngredients}>{name}</p>
				<div className={classStr}>
					<p className="h5">Ingredients</p>
					<div className="ingredientList">
						{ingredientNodes}
					</div>
					<p className="h5">Steps</p>
					<div className="ingredientList">
						{stepNodes}
					</div>
					<div className="button-section">
						<Button bsStyle="default" onClick={() => this.setState({ show: true})}>Edit</Button>
						{onDelete ? this.renderDelete() : null}
						<div className="modal-container">
							<Modal
								show={this.state.show}
								onHide={close}
								container={this}
								aria-labelledby="contained-modal-title">

								<Modal.Header>
									<Modal.Title>Edit Recipe</Modal.Title>
								</Modal.Header>

								<Modal.Body>
									<form id="recipeEditForm">
										<div className="form-group">
											<label htmlFor="recipeName">Name</label>
											<input type="text" className="form-control" id="recipeName" name="recipeName" size="50" value={this.props.name} readOnly />
										</div>
										<div className="form-group">
											<label htmlFor="recipeIngredientsEdit">Ingredients</label>
											<input type="text" className="form-control" id="recipeIngredientsEdit" name="recipeIngredientsEdit" value={this.state.ingredients} onChange={this.updateIngredientsField} size="50" />
										</div>

										<div className="form-group">
											<label htmlFor="recipeStepsEdit">Steps</label>
											<textarea className="form-control" id="recipeStepsEdit" name="recipeStepsEdit" value={this.state.stepsStr} onChange={this.updateStepsField} rows="10" cols="50"></textarea>
										</div>


									</form>
								</Modal.Body>

								<Modal.Footer>
									<Button type="submit" onClick={this.editRecipe} bsStyle="primary">Save</Button>
									<Button bsStyle="default" onClick={() => this.setState({show: false})}>Close</Button>
								</Modal.Footer>
							</Modal>
						</div>
					</div>
				</div>
			</div>
		);
	}

	/**
	 * Updates state with edit form values
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
	 */
	updateIngredientsField = (event) => {
		let ingredientsStr = event.target.value;
		let ingredientsAr = ingredientsStr.split(',');
		this.setState({ingredients: ingredientsAr});
	};

//same as above (updateIngredientsField)
	/**
	 * Updates state with edit form values
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
	 */
	updateStepsField = (event) => {
//Issue 051016 when try to edit steps, weird line break behavior

		let stepsStr = event.target.value;
		console.log('edit stepsStr: ' + stepsStr);
		this.setState({stepsStr: stepsStr});
		console.log('stepsStr from state: ' + stepsStr);

		// let stepsAr = stepsStr.split('\n');
		// this.setState({steps: stepsAr});
		// stepsAr.forEach(function(step) {
		// 	stepsEditStr += step + '\n';
		// });

	};

	/**
	 * Concatenate multi-word names (removing spaces), otherwise the class name used to select
	 * a long name would break the accordion display functionality due to spaces
	 * @return {[type]} [description]
	 */
	concatName = () => {
		let name = this.props.name;
		let nameAr = name.split(' ');
		let nameStr = nameAr.join('');
		return nameStr;
	};

	/**
	 * Toggles accordion visibility. Modifies state, isOpen.
	 * @return {[type]} [description]
	 */
	toggleIngredients = () => {
		if (this.state.isOpen) {
			this.setState({isOpen: false});
		} else {
			this.setState({isOpen: true});
		}
	};

	/**
	 * Updates localStorage and state with edit form ingredients values
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
	 */
	editRecipe = (event) => {
		event.preventDefault();

		var keys;
		var curKey;
		var keysAr = [];
		let name = this.props.name
		let allRecipes = base.fetch('recipes', {
			context: this,
			then(data) {
				keys = Object.keys(data);

				for (var mkey in keys) {
					if (data[keys[mkey]].name === name) {
						curKey = keys[mkey];
					}
				}
			}
		});

	//parsing the ingredients, cleaning up the format so it will display cleanly later on
		let ingredientsAr = this.state.ingredients;
		var ingredientsTrim = [];
		ingredientsAr.forEach(function(item) {
			var itemCopy = item.slice(0).trim();
			ingredientsTrim.push(itemCopy);
		});
		var ingredientsStrClean = ingredientsTrim.join(',');
//Issue 051016 this is not getting updated in the db
		let stepsAr = this.state.steps;
		let endpoint = 'recipes/' + curKey;
		//console.log('endpoint: ' + endpoint);

		base.post(endpoint, {
			data: {name: name, ingredients: ingredientsStrClean, steps: stepsAr},
			then() {
				//console.log('updated recipe');
			}
		});

		let form = document.getElementById('recipeEditForm');
		form.reset();
	};

	renderDelete = () => {
		return <Button bsStyle="danger" data={this.state.name} onClick={this.props.onDelete} >Delete</Button>
	};

//TODO update doc
	///**
	// * Updates localStorage and state with edit form ingredients values
	// * @param  {[type]} event [description]
	// * @return {[type]}       [description]
	// */
// 	getStepsStr = () => {
// 		let stepsSt = '';
// 		let stepsAr = this.state.steps;
// 		if (stepsAr) {
// 			for (var s in stepsAr) {
// 				stepsSt += stepsAr[s] + '\n';
// 			}
// //			stepsAr.forEach(function(step) {
// //				stepsSt += step + '\n';
// //			});
// 		}
// 		return stepsSt;
// 	}

	/**
	 *
	 *
	 */
	convertStepsObjToString = (stepObjects) => {
		let stepsStr = '';
		///let stepsAr = this.state.steps;
		if (stepObjects) {
			for (let step in stepObjects) {
				stepsStr += stepObjects[step] + '\n';
			}
//			stepsAr.forEach(function(step) {
//				stepsSt += step + '\n';
//			});
		}
		return stepsStr;
	}

}


/**
 * Helper that removes spaces between chars/words; used to create recipe name
 * unique keys where the name has multiple words
 * @param  {[type]} str [description]
 * @return {[type]}     [description]
 */
function trimSpaces(str) {
	let ar = [], resultStr;
	ar = str.split(' ');
	resultStr = ar.join('');

	return resultStr;
}