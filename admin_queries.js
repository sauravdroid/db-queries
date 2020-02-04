db.users.aggregate([{
	$project: {
		annotated_at: 1,
		time_taken: 1,
		last_history: {$arrayElemAt: ["$history": -1]}
	}
}])

db.annotation.aggregate([
	{
		$project: {
			last: {$arrayElemAt: ["$history", -1]},
			annotated_at_new: "$last.annotated_at"
		}
	}
]).pretty()

db.annotation.aggregate([
	{
		$project: {
			annotated_at: 1,
			yearMonth: {
				$dateToString: {
					format: '%Y-%m-%d', 
					date: "$annotated_at"
				}
			}
		}
	}
])

db.annotation.aggregate([
	{
		$project: {
			annotated_at: 1,
		}
	}
])

// Daily
db.annotation.aggregate([
	{
		$addFields: {
			last: {$arrayElemAt: ["$history", -1]},
		}
	},
	{
		$addFields: {
			annotated_at: {
				$dateToString: {
					format: "%Y-%m-%d",
					date: "$last.annotated_at"
				}
			}
		}
	},
	{
		$match: {annotated_at: '2019-10-10'}
	},
	{
		$count: "annotation_today"
	}
])

// Monthly
// Queries that gives documents from certain dates
db.annotation.aggregate([
	{
		$addFields: {
			last: {$arrayElemAt: ["$history", -1]}
		}	
	},
	{
		$addFields: {
			annotated_at: {
				$dateToString: {
					format: "%Y-%m-%d",
					date: "$last.annotated_at"
				}
			}
		}
	},
	{
		$addFields: {
			annotated_at: {
				$dateFromString: {
					dateString: "$annotated_at",
					format: "%Y-%m-%d"
				}
			}
		}
	},
	{
		$match: {
			annotated_at: {
				$gte: ISODate("2019-10-05"),
				$lte: ISODate("2019-10-10")
			}
		}
	},
	{
		$count: "total_annotations"
	}
]).pretty()

// Getting total users who have annotated in a single date
// Daily
db.annotation.aggregate([
	{
		$addFields: {
			last: {$arrayElemAt: ["$history", -1]},
			user: "$user"
		}	
	},
	{
		$addFields: {
			annotated_at: {
				$dateToString: {
					format: "%Y-%m-%d",
					date: "$last.annotated_at"
				}
			}
		}
	},
	{
		$addFields: {
			annotated_at: {
				$dateFromString: {
					dateString: "$annotated_at",
					format: "%Y-%m-%d"
				}
			}
		}
	},
	{
		$match: {
			annotated_at: {
				$gte: ISODate("2019-10-05"),
				$lte: ISODate("2019-10-29")
			}
		}
	},
	{
		"$group": {_id: "$user"}
	}
]).pretty()

// Getting the user progress as well as the image index by left outer join of two collections
db.user.aggregate([
	{
		$match: {
			progress: {
				$elemMatch: {current_set: ObjectId("5d9ad4af07ab248cca02de1f")}
			}
		}
	},
	{
		$project: {
			progress: {
				$filter: {
					input: "$progress",
					as: "progress",
					cond: {$eq: ["$$progress.current_set", ObjectId("5d9ad4af07ab248cca02de1f")]}
				}
			}
		}
	}
]).pretty()


db.user.aggregate([
	{
		$addFields: {
			email: "$email",
			first_name: "$first_name",
			last_name: "$last_name",
			middle_name: "$middle_name",
			progress: "$progress"
		}
	},
	{
		$match: {
			progress: {
				$elemMatch: {current_set: ObjectId("5d9ad4af07ab248cca02de1f")}
			}
		}
	},
	{
		$addFields: {
			progress: {
				$filter: {
					input: "$progress",
					as: "progress",
					cond: {$eq: ["$$progress.current_set", ObjectId("5d9ad4af07ab248cca02de1f")]}
				}
			},
			actualProgress: {$arrayElemAt: ["$progress", 0]}
		}
	},
	{
		$lookup: {
			from: "image_data",
			localField: "actualProgress.current_image",
			foreignField: "_id",
			as: "image_data_joined"
		}
	},
	{
		$addFields: {
			req_image_data: {$arrayElemAt: ["$image_data_joined", 0]},
		}
	},
	{
		$addFields: {
			"sets": "$req_image_data.set_info"
		}
	},
	{
		$addFields: {
			"image_set_detail": {
				$filter: {
					input: "$sets",
					as: "setItem",
					cond: {
						$eq: ["$$setItem.set_id", ObjectId("5d9ad4af07ab248cca02de1f")]
					}
				}
			}
		}
	},
	{
		$project: {
			"email": 1,
			"first_name": 1,
			"last_name": 1,
			"middle_name": 1,
			"actualProgress": 1,
			"selected_image_detail": {$arrayElemAt: ["$image_set_detail", 0]}
		}
	}
]).pretty()


// {
// 	$match: {
// 		"req_image_data.set_info": {
// 			set_id: ObjectId("5d9ad4af07ab248cca02de1f")
// 		}
// 	}
// }



















