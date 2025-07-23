
// if (userDetails) {
//     console.log(`Current User Type: ${userType}`);
//     console.log(userDetails.applicants);
//     const applicantIds = userDetails.applicants.map(candidate => candidate.toString());
//     console.log(applicantIds);

//     if (applicantIds) {
//         forms = await Form.find({ _id: { $in: applicantIds } }).exec();
//     }
// } else {
//     console.log("User not found in either collection.");
// }

// let internDetailsArray = [];
// for (const form of forms) {
//     let idIntern = form.intern.toString();
//     const internDetails = await Intern.findById(idIntern);
//     internDetailsArray.push(internDetails);
// }

// const internDetails = internDetailsArray;
// console.log('Intern Details:', internDetails);
// console.log('Forms:', forms);
