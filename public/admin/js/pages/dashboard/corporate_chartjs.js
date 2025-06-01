$(function () {
    new Chart(document.getElementById("bar_chart").getContext("2d"), getChartJs());
});

function getChartJs() {
    var config 	= 	null;
	var activeEmployee 	= [];
	var inactiveEmployee = [];
	var pendingEmployee = [];
	userRecords.map((userData)=>{
		activeEmployee.push(userData.total_active_employee);
		inactiveEmployee.push(userData.total_inactive_employee);
		pendingEmployee.push(userData.total_pending_employee);
	});

	config = {
		type: 'bar',
		data: {
			labels: [],
			datasets: [
				{
					label: "Active Employees",
					data: activeEmployee.reverse(),
					backgroundColor: 'rgba(0, 128, 0, 128)'
				},
				{
					label: "Inactive Employees",
					data: inactiveEmployee.reverse(),
					backgroundColor: 'rgba(207, 0, 15, 1)'
				},
				{
					label: "Pending Employees",
					data: pendingEmployee.reverse(),
					backgroundColor: 'rgba(247, 202, 24, 1)'
				},
			]
		},
		options: {
			maintainAspectRatio: false,
			responsive: true,
			legend: {
				display		:	true,
				fullWidth	: 	true,
				position 	:	"top",
				labels		: 	{
					fontColor: 'rgb(255, 99, 132)'
				}
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						userCallback: function(label, index, labels) {
							if (Math.floor(label) === label) {
								return label;
							}
						},
					}
				}],
				xAxes: [{
					barPercentage: 0.1
				}]
			}
		},

	};
    return config;
}
