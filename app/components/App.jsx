//app/components/App.jsx

import React from 'react';
import ReactDOM from 'react-dom';
import Recipes from './Recipes.jsx';
import uuid from 'node-uuid';
import {Modal} from 'react-bootstrap';
import {Button} from 'react-bootstrap';
import {Input} from 'react-bootstrap';
import Rebase from 're-base';

var base = Rebase.createClass('https://recipe-keeper.firebaseio.com/web/data');
var recipesRef = new Firebase('https://recipe-keeper.firebaseio.com/web/data/recipes/');

export default class App extends React.Component {
	constructor(props) {
		super();
		let namesAr = [];
		this.state = {
			recipes: [],
			show: false,
			nameValid: 'success'
		};
	}

//05.02.16 3:45p need to verify; not sure componentWillMount goes here in es6 format
	componentWillMount() {
		base.bindToState('recipes', {
			context: this,
			state: 'recipes',
			asArray: true
		});
	}

	render() {
		let recipes = this.state.recipes;
		return (
			<div className="container-fluid" >
				<div className="row">
					<nav className="navbar navbar-default">
						<div className="navbar-header">
							<a className="navbar-brand" href="#">Recipe Box</a>
							<button className="btn btn-default navbar-btn" onClick={this.googleLogin} >Login with Google</button>
							<button className="btn btn-default navbar-btn navbar-right" onClick={this.logOut} >Log Out</button>
						</div>
					</nav>
				</div>
				<Recipes recipes={recipes} onDelete={this.deleteRecipe} />
				<Button
					bsStyle="default"
					onClick={() => this.setState({ show: true})}>
						Add Recipe
				</Button>
				<div className="modal-container">
					<Modal
						show={this.state.show}
						onHide={close}
						container={this}
						aria-labelledby="contained-modal-title">

						<Modal.Header>
							<Modal.Title>Add Recipe</Modal.Title>
						</Modal.Header>

						<Modal.Body>
							<form id="recipeForm">
								<div className="form-group">
									<Input type="text" 
										label="Name" 
										groupClassName="group-class"
										labelClassName="label-class"
										id="recipeName"
										name="recipeName"
										size="50"
										help="Name must be unique or recipe will not be saved."
										bsStyle={this.state.nameValid} hasFeedback
										onChange={this.validationState}
									/>
								</div>
								<div className="form-group">
									<label htmlFor="recipe-ingredients">Ingredients</label>
									<input type="text" className="form-control" id="recipeIngredients" name="recipeIngredients" placeholder="enter ingredients separated by commas" size="50" />
								</div>
								<div className="form-group">
									<label htmlFor="recipe-steps">Steps</label>
									<textarea className="form-control" id="recipeSteps" name="recipeSteps" placeholder="enter steps separated by line break" rows="10" cols="50"></textarea>
								</div>


							</form>
						</Modal.Body>

						<Modal.Footer>
							<Button type="submit" onClick={this.addRecipe} bsStyle="primary" >Save</Button>
							<Button bsStyle="default" onClick={() => this.setState({show: false})}>Close</Button>
						</Modal.Footer>
					</Modal>
				</div>
				<div className="row footer">
					<div className="col-xs-12 col-sm-12">
						<p className="text-center">Brought to you with <i className="fa fa-heart"></i><br /> 
							from <a href="http://www.carolchung.com" target="_blank">Tusk Tusk Dev.</a><br />
							<a href="https://github.com/cch5ng/recipe-box" target="_blank">Source</a>
						</p>
					</div>
				</div>
			</div>
		);
	}

	/**
	 * Adds recipe to local storage and to state
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
	 */
	addRecipe = (event) => {
		if (this.state.nameValid === 'success') {
			let name = document.getElementById('recipeName').value;
			event.preventDefault();

			//parsing the ingredients, cleaning up the format so it will display cleanly later on
			var ingredientsStr = document.getElementById('recipeIngredients').value;
			var ingredientsAr = ingredientsStr.split(',');
			//stores final array of ingredients strings, trimmed
			var ingredientsTrim = [];
			ingredientsAr.forEach(function(item) {
				var itemCopy = item.slice(0).trim();
				ingredientsTrim.push(itemCopy);
			});

			var stepsStr = document.getElementById('recipeSteps').value;
			var stepsAr = stepsStr.split('\n');

			//authenticate session before insert
			let authData = base.getAuth();
			if (authData) {
				base.push('recipes', {
					data:  {name: name,
						owner: 'cchung',
						ingredients: ingredientsTrim,
						steps: stepsAr
					},
					then(){
						//console.log('inserted recipe');
					}
				});
			} else {
				base.authWithOAuthPopup('google', (error, authData) => {
					if (error) {
						console.log("Login Failed!", error);
					} else {
						console.log("Authenticated successfully with payload");
						//update firebase
					}
				}, {
					remember: 'sessionOnly'
				});
			}
		}
	};

	/**
	 * Form validation to ensure that a new name field is unique (key in localStorage)
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
	 */
	validationState = (event) => {
		this.setState({
			nameValid: 'success'
		})
		let curName = event.target.value;
		let namesAr = [];
		let recipesAr = this.state.recipes;
		let keysAr = [];
		recipesAr.map(function(recipe) {
			//console.log('recipe.name' + recipe.name);
			if (recipe.name === curName) {
				namesAr.push(recipe.name);
			}
		});
		//console.log('namesAr: ' + namesAr);

		for (let i = 0; i < namesAr.length; i++) {
			if (curName === namesAr[i]) {
				this.setState({nameValid: 'error'});
			} else {
				this.setState({nameValid: 'success'});
			}
		}
	};

	/**
	 * Deletes a recipe from localStorage and state (recipes array). Triggered from Recipe.jsx button.
	 * @param  {String} id - Recipe id
	 * @return {[type]}    [description]
	 */
	deleteRecipe = (key) => {
		var onComplete = function(error) {
			if (error) {
				console.log('synchronization issue: ' + error);
			} else {
				//console.log('synchronization succeeded');
			}
		}

		//authenticate session before insert
		let authData = recipesRef.getAuth();
		if (authData) {
			//update firebase
			recipesRef.child(key).remove(onComplete);
		} else {
			recipesRef.authWithOAuthPopup('google', (error, authData) => {
				if (error) {
					console.log("Login Failed!", error);
				} else {
					console.log("Authenticated successfully with payload");
				}
			}, {
				remember: 'sessionOnly'
			});
		}
	};

	/**
	 * Triggers rebase authWithOAuthPopup() function for google-based login.
	 * @param  {String} id - Recipe id
	 * @return {[type]}    [description]
	 */
	googleLogin = () => {
		base.authWithOAuthPopup('google', (error, authData) => {
			if (error) {
				console.log("Login Failed!", error);
			} else {
				console.log("Authenticated successfully with payload");
//TODO save token to localstorage
			}
		}, {
			remember: 'sessionOnly'
		});
	}

	/**
	 * Log out of firebase
	 * @param  {String} id - Recipe id
	 * @return {[type]}    [description]
	 */
	logOut = () => {
		base.unauth();
		if (recipesRef.getAuth()) {
			recipesRef.unauth();
		}
	}

}