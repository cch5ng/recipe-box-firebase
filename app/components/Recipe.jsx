//app/components/Recipe.jsx

import React from 'react';
import {Modal} from 'react-bootstrap';
import {Button} from 'react-bootstrap';
import {Input} from 'react-bootstrap';
import Rebase from 're-base';
import uuid from 'uuid';

var base = Rebase.createClass('https://recipe-keeper.firebaseio.com/web/data');
var recipesRef = new Firebase("https://recipe-keeper.firebaseio.com/recipes");
var stepsEditStr = '';

export default class Recipe extends React.Component {

	constructor(props) {
		super(props);

		let stepsStr = this.convertStepToString(this.props.steps);
		let ingredientsStr = this.convertIngredientToString(this.props.ingredients);

		this.state = {
			isOpen: false,
			name: this.props.name,
			ingredients: this.props.ingredients,
			ingredientsStr: ingredientsStr,
			steps: this.props.steps,
			stepsStr: stepsStr
		}
	}

	render() {
		var name = this.props.name;
		const onDelete = this.props.onDelete;
		const onEdit = this.props.onEdit;

		//using the recipe name as a unique identifier to set className and accordion display state
		let classStr, classStrOutter;
		let recipeClass;
		(this.state.isOpen) ? classStr = this.concatName() + ' padding' : classStr = this.concatName() + ' padding hidden';
		(name) ? classStrOutter = 'recipe clear' : classStrOutter = 'recipe clear hidden';

		let nameStr = this.props.name;
		var ingreds = this.state.ingredients;
		var ingredsAr = [];
		//firebase stores lists in object format
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
		var stepsAr = [];
		//firebase stores lists in object format
		if (typeof steps === 'object') {
			for (var step in steps) {
				stepsAr.push(steps[step]);
			}
		}
		var stepNodes = stepsAr.map(function(step, idx) {
			let keyStr = uuid.v1();
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

		recipeClass = classStrOutter + ' col-xs-12 col-sm-2 col-md-3';
//		<p className="h4" onClick={this.toggleIngredients}>{name}</p>

		return (
			<div className="col-xs-12 col-sm-6 col-md-6 col-lg-4" key={this.state.key}>
				<a href="#" className="title" alt="ice cream"><img src={this.props.image_url} className="img-responsive" alt="photo" />
					<div className="hover-title">{name}</div>
				</a>
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
						<Button bsStyle="default" onClick={this.editBtnClick}>Edit</Button>
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
											<input type="text" className="form-control" id="recipeIngredientsEdit" name="recipeIngredientsEdit" value={this.state.ingredientsStr} onChange={this.updateIngredientsField} size="50" />
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
	 * Updates state with edit form values for ingredients
	 * @param  {[type]} event [description]
	 *
	 */
	updateIngredientsField = (event) => {
		let ingredientsStr = event.target.value;
		this.setState({ingredientsStr: ingredientsStr});
	};

	/**
	 * Updates state with edit form values for steps
	 * @param  {[type]} event [description]
	 *
	 */
	updateStepsField = (event) => {
		let stepsStr = event.target.value;
		this.setState({stepsStr: stepsStr});
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
	 * Updates firebase and state with edit form ingredient and step values
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
		let curIngredientsAr = this.state.ingredientsStr.split(',');
		var ingredientsTrim = [];

		curIngredientsAr.forEach((ingredient) => {
			ingredientsTrim.push(ingredient.trim());
		});

		let stepsAr = this.state.stepsStr.split('\n');
		let endpoint = 'recipes/' + curKey;

		//authenticate session before insert
		let authData = base.getAuth();
		if (authData) {
			base.post(endpoint, {
				data: {name: name, ingredients: ingredientsTrim, steps: stepsAr},
				then() {
				}
			});
			//updating state for the read view of the recipe detail
			this.setState({
				ingredients: this.convertIngredientStrToObject(this.state.ingredientsStr),
				steps: this.convertStepStrToObject(this.state.stepsStr),
				authData: authData
			});
		} else {
			base.authWithOAuthPopup('google', (error, authData) => {
				if (error) {
					console.log("Login Failed!", error);
				} else {
					console.log("Authenticated successfully with payload");
//refactor (dupe above)
					//updating state for the read view of the recipe detail
					this.setState({
						ingredients: this.convertIngredientStrToObject(this.state.ingredientsStr),
						steps: this.convertStepStrToObject(this.state.stepsStr)
					});
				}
			}, {
				remember: 'sessionOnly'
			});
		}

		let form = document.getElementById('recipeEditForm');
		form.reset();
	};

	/**
	 * Render delete button
	 * @return HTML string for Delete button
	 */
	renderDelete = () => {
		return <Button bsStyle="danger" data={this.state.name} onClick={this.props.onDelete} >Delete</Button>
	};

	/**
	 * Convert object from firebase to string for form text area display
	 * @param  {object} object representation of recipe steps (firebase storage return for list)
	 * @return string, delimited by newline
	 */
	convertStepToString = (objects) => {
		let itemStr = '';
		let length = Object.keys(objects).length;
		if (objects) {
			for (let item in objects) {
				if (item < length - 1) {
					itemStr += objects[item] + '\n';
				} else {
					itemStr += objects[item]
				}
			}
		}
		return itemStr;
	}

	/**
	 * Convert object from firebase to string for form input text display
	 * @param  {object} object representation of recipe ingredients (firebase storage return for list)
	 * @return string, comma delimited
	 */
	convertIngredientToString = (objects) => {
		let itemStr = '';
		let length = Object.keys(objects).length;
		if (objects) {
			for (let item in objects) {
				if (item < length - 1) {
					itemStr += objects[item] + ',';
				} else {
					itemStr += objects[item]
				}
			}
		}
		return itemStr;
	}

	/**
	 * Convert latest form input text string to object for firebase update
	 * @param string
	 * @return {object} representation of ingredients
	 */
	convertIngredientStrToObject = (str) => {
		let ingObj = {};
		let ingAr = str.split(',');
		ingAr.forEach((ingred, idx) => {
			ingObj[idx] = ingred;
		});
		return ingObj;
	}

	/**
	 * Convert latest form text area string to object for firebase update
	 * @param string
	 * @return {object} representation of steps
	 */
	convertStepStrToObject = (str) => {
		let stepObj = {};
		let stepAr = str.split('\n');
		stepAr.forEach((step, idx) => {
			stepObj[idx] = step;
		});
		return stepObj;
	}

	/**
	 * Edit button click handler
	 * result: update state so the recipe edit modal displays
	 */
	editBtnClick = () => {
		this.setState({ show: true});
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