
    <!-- <nav class="navbar navbar-expand-lg company-navbar" style="background-color: 
    #A4CDED;">
    <div class="logo-company">
        <img src="/img/logo.png" alt="please check your network">
    </div>

    <div class="profile-img">
        <div class="profile">
            <% if(userDetails) {%>
                <a href="/profile/<%= userDetails._id %>">
                    <img src="<%= userDetails.photos %>" alt="check your network">
                </a>
                <% } %>
        </div>
    </div>
</nav>

<div class="container">
    <div class="back-icon-company-profile">
        <a href="/"><i class="fa-solid fa-arrow-left"></i></i></a>
    </div>

    <div class="title">
        <h3>Profile of Candidates who apply for your company</h3>
    </div>
    <% if (internDetails.length> 0) { %>
        <% for(user of internDetails) {%>
            <div class="company-list">
                <div class="image">
                    <img src="<%= user.photos %>" alt="check your network">
                </div>
                <div class="details">
                    <h4 class="margin-bitton">Name : <%= user.username %>
                    </h4>
                    <h5 class="margin-bitton">Email: <%= user.email %>
                    </h5>
                    <p class="margin-bitton">Experience: <%= user.experience %>
                    </p>
                </div>
            </div>
            <% } %>
                <% } else {%>
                    <p style="text-align: center; font-size: 2rem; color: red; ">No One Who Apply For Your Company</p>
                    <% } %>

                        <div class="title">
                            <h3>Details of Candidates who apply for your company</h3>
                        </div>
                        <% if (internDetails.length> 0) { %>
                        <div class="main-form">
                            <% for(form of forms) {%>
                                <div class="small">
                                    <h4>Name: <%= form.fullName %>
                                    </h4>
                                    <p><span style="font-weight: 700;">Address:</span>
                                        <%= form.address %>
                                    </p>
                                    <p><span style="font-weight: 700;">Phone:</span>
                                        <%= form.phone %>
                                    </p>
                                    <p><span style="font-weight: 700;">Email:</span>
                                        <%= form.email %>
                                    </p>
                                    <p><span style="font-weight: 700;">position:</span>
                                        <%= form.position %>
                                    </p>
                                    <p><span style="font-weight: 700;">salary:</span>
                                        <%= form.salary %>
                                    </p>
                                    <p><span style="font-weight: 700;">Starting Date:</span>
                                        <%= form.startDate %>
                                    </p>
                                    <p><span style="font-weight: 700;">Employment Type:</span>
                                        <%= form.employmentType %>
                                    </p>
                                    <p><span style="font-weight: 700;">School:</span>
                                        <%= form.highSchool %>
                                    </p>
                                    <p><span style="font-weight: 700;">School Location:</span>
                                        <%= form.highSchoolLocation %>
                                    </p>
                                    <p><span style="font-weight: 700;">College:</span>
                                        <%= form.college %>
                                    </p>
                                    <p><span style="font-weight: 700;">College Location:</span>
                                        <%= form.collegeLocation %>
                                    </p>
                                    <p><span style="font-weight: 700;">Degree:</span>
                                        <%= form.degree %>
                                    </p>
                                    <p><span style="font-weight: 700;">Certifications:</span>
                                        <%= form.certifications %>
                                    </p>
                                    <hr>
                                </div>
                                <% } %>
                                <% } else {%>
                                    <p style="text-align: center; font-size: 2rem; color: red; ">No One Who Apply For Your Company</p>
                                <% } %>
                        </div>
</div>

<div class="footer">
    <ul>
        <li>CareerBridge &copy; 2024 All right reserved</li>
    </ul>
</div> -->

if (userDetails) {
    console.log(`Current User Type: ${userType}`);
    console.log(userDetails.applicants);
    const applicantIds = userDetails.applicants.map(candidate => candidate.toString());
    console.log(applicantIds);

    if (applicantIds) {
        forms = await Form.find({ _id: { $in: applicantIds } }).exec();
    }
} else {
    console.log("User not found in either collection.");
}

let internDetailsArray = [];
for (const form of forms) {
    let idIntern = form.intern.toString();
    const internDetails = await Intern.findById(idIntern);
    internDetailsArray.push(internDetails);
}

const internDetails = internDetailsArray;
console.log('Intern Details:', internDetails);
console.log('Forms:', forms);
