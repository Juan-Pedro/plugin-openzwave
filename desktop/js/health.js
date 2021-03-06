var app_health = {
    // note variable nodes is global!

    updater: false,

    timestampConverter: function (time, _hourOnly) {
        if (time == 1)
            return "N/A";
        var ret;
        var date = new Date(time * 1000);
        var hours = date.getHours();
        if (hours < 10) {
            hours = "0" + hours;
        }
        var minutes = date.getMinutes();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        var num = date.getDate();
        if (num < 10) {
            num = "0" + num;
        }
        var month = date.getMonth() + 1;
        if (month < 10) {
            month = "0" + month;
        }
        var year = date.getFullYear();
        var formattedTime = hours + ':' + minutes;
        var formattedDate = num + "/" + month + "/" + year;
        if (_hourOnly) {
            return formattedTime;
        }
        return formattedDate + ' ' + formattedTime;
    },
    init: function () {
        app_health.load_data(true);
        app_health.updater = setInterval(function () {
            if ($('#table_healthNetwork').is(':visible')) {
                app_health.load_data(false);
            } else {
                app_health.hide();
            }
        }, 2000);
        $('#bt_pingAllDevice').off().on('click', function () {
            $.ajax({
                url: path + "ZWaveAPI/Run/controller.TestNetwork()",
                dataType: 'json',
                async: true,
                error: function (request, status, error) {
                    handleAjaxError(request, status, error, $('#div_networkHealthAlert'));
                },
                success: function (data) {
                    app_health.sendOk();
                    app_health.load_data(false);
                }
            });
        });

        $('#table_healthNetwork').off().delegate('.bt_pingDevice', 'click', function () {
            $.ajax({
                url: path + "ZWaveAPI/Run/devices[" + $(this).attr('data-id') + "].TestNode()",
                dataType: 'json',
                async: true,
                error: function (request, status, error) {
                    handleAjaxError(request, status, error, $('#div_networkHealthAlert'));
                },
                success: function (data) {
                    app_health.sendOk();
                    app_health.load_data(false);
                }
            });
        });
    },
    hide: function () {
        clearInterval(app_health.updater);
    },
    load_data: function (_global) {
        $.ajax({
            url: path + "ZWaveAPI/Run/network.GetHealth()",
            dataType: 'json',
            async: true,
            global: _global,
            error: function (request, status, error) {
                handleAjaxError(request, status, error, $('#div_networkHealthAlert'));
            },
            success: function (data) {
                infos = data;
                app_health.show_infos(data.devices);
            }
        });
    },
    show_infos: function (nodes) {
        var tbody = '';
        var now = Math.floor(new Date().getTime() / 1000);
        for (var node_id in nodes) {
            if (nodes[node_id].data == undefined) {
                continue;
            }
            if (nodes[node_id].data.isEnable.value) {
                tbody += '<tr >';
            }
            else {
                tbody += '<tr class="active">';
            }
            // device name
            tbody += '<td>';
            var name = '<span class="nodeConfiguration cursor" data-node-id="' + node_id + '" data-server-id="' + $("#sel_zwaveHealthServerId").value() + '">';
            if (typeof eqLogic_human_name !== 'undefined' && isset(eqLogic_human_name[$('#sel_zwaveHealthServerId').value() + ':' + node_id])) {
                name += eqLogic_human_name[$('#sel_zwaveHealthServerId').value() + ':' + node_id];
            } else if (nodes[node_id].data.description.name != '') {
                name += '<span  class="label label-primary" style="font-size : 1em;">' + nodes[node_id].data.description.location + '</span> ' + nodes[node_id].data.description.name;
            } else {
                name += nodes[node_id].data.description.product_name;
            }
            name += '</span>';
            if (nodes[node_id].data.isEnable.value) {
                tbody += name;
            }
            else {
                tbody += '<div style="opacity:0.5"><i>' + name + '</i></div>';
            }
            tbody += '</td>';
            // device id
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                tbody += node_id;
            }
            else {
                tbody += '<div style="opacity:0.5"><i>' + node_id + '</i></div>';
            }
            tbody += '</td>';
            // Notification
            tbody += '<td>';
            var notification = '';
            if (nodes[node_id].last_notification != undefined) {
                if (nodes[node_id].last_notification.description == 'Timeout') {
                    notification += '<span class="label label-warning" style="font-size : 1em;" title="' + nodes[node_id].last_notification.help + '">' + nodes[node_id].last_notification.description + '</span>';
                } else if (nodes[node_id].last_notification.description == 'Dead') {
                    notification += '<span class="label label-danger" style="font-size : 1em;" title="' + nodes[node_id].last_notification.help + '">' + nodes[node_id].last_notification.description + '</span>';
                } else if (nodes[node_id].last_notification.description != undefined) {
                    notification += '<span class="label label-primary" style="font-size : 1em;" title="' + nodes[node_id].last_notification.help + '">' + nodes[node_id].last_notification.description + '</span>';
                } else {
                    notification += '<span class="label label-primary" style="font-size : 1em;" title="{{Non disponible}}">...</span>';
                }
            }
            if (nodes[node_id].data.isEnable.value) {
                tbody += notification;
            }
            else {
                tbody += '<div style="opacity:0.5"><i>' + notification + '</i></div>';
            }
            tbody += '</td>';
            // have valid groups
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.is_groups_ok != undefined && nodes[node_id].data.is_groups_ok.value) {
                    tbody += '<span class="label label-success" style="font-size : 1em;">{{OK}}</span>';
                } else {
                    if (nodes[node_id].data.is_groups_ok.enabled) {
                        tbody += '<span class="label label-danger" style="font-size : 1em;">{{NOK}}</span>';
                    }
                }
            }
            tbody += '</td>';
            // have valid zwave ids
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.is_manufacturer_specific_ok != undefined && nodes[node_id].data.is_manufacturer_specific_ok.value) {
                    tbody += '<span class="label label-success" style="font-size : 1em;">{{OK}}</span>';
                } else {
                    tbody += '<span class="label label-danger" style="font-size : 1em;">{{NOK}}</span>';
                }
            }
            tbody += '</td>';
            // neighbours test
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.is_neighbours_ok != undefined && nodes[node_id].data.is_neighbours_ok.value) {
                    tbody += '<span class="label label-success" style="font-size : 1em;">{{OK}}</span>';
                } else {
                    if (nodes[node_id].data.is_neighbours_ok.enabled) {
                        tbody += '<span class="label label-danger" style="font-size : 1em;">{{NOK}}</span>';
                    }
                }
            }
            tbody += '</td>';
            // pending changes
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.pending_changes != undefined && nodes[node_id].data.pending_changes.value > 0) {
                    tbody += '<span class="label label-warning" style="font-size : 1em;" title="' + nodes[node_id].data.pending_changes.value + ' {{configuration(s) en attente d\'être appliquée(s)}}" >' + nodes[node_id].data.pending_changes.value + '</span>';
                } else if (nodes[node_id].data.pending_changes != undefined && nodes[node_id].data.pending_changes.value == 0) {
                    tbody += '<span class="label label-success" style="font-size : 1em;">{{OK}}</span>';
                }
            }
            tbody += '</td>';
            // status
            tbody += '<td>';
            var status = '';
            if (nodes[node_id].data.isFailed != undefined && !nodes[node_id].data.isFailed.value) {
                if (nodes[node_id].data.state != undefined) {
                    if (nodes[node_id].data.state.value == 'Complete') {
                        status += '<span class="label label-success" style="font-size : 1em;">' + nodes[node_id].data.state.value + '</span>';
                    } else {
                        status += '<span class="label label-warning" style="font-size : 1em;">' + nodes[node_id].data.state.value + '</span>';
                    }
                } else {
                    status += '<span class="label label-success" style="font-size : 1em;">{{OK}}</span>';
                }
            } else {
                status += '<span class="label label-danger" style="font-size : 1em;">{{DEATH}}</span>';
            }
            if (nodes[node_id].data.isEnable.value) {
                tbody += status;
            }
            else {
                tbody += '<div style="opacity:0.5"><i>' + status + '</i></div>';
            }
            tbody += '</td>';
            // powered vs battery
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.isListening.value) {
                    tbody += '<span class="label label-primary" style="font-size : 1em;" title="{{Secteur}}"><i class="fa fa-plug"></i></span>';
                }
                else {
                    if (nodes[node_id].data.battery_level != undefined && nodes[node_id].data.battery_level.value != null) {
                        var updateTime = '';
                        if (nodes[node_id].data.battery_level.updateTime != undefined) {
                            updateTime = app_health.timestampConverter(nodes[node_id].data.battery_level.updateTime, false);
                        }
                        if (nodes[node_id].data.battery_level.value > 75) {
                            tbody += '<span class="label label-success" style="font-size : 1em;" title="' + updateTime + '">' + nodes[node_id].data.battery_level.value + '%</span>';
                        } else if (nodes[node_id].data.battery_level.value > 50) {
                            tbody += '<span class="label label-warning" style="font-size : 1em;" title="' + updateTime + '">' + nodes[node_id].data.battery_level.value + '%</span>';
                        } else {
                            tbody += '<span class="label label-danger" style="font-size : 1em;" title="' + updateTime + '">' + nodes[node_id].data.battery_level.value + '%</span>';
                        }
                    } else if (nodes[node_id].data.wakeup_interval != undefined && nodes[node_id].data.wakeup_interval.value != null) {
                        tbody += '<span class="label label-warning" style="font-size : 1em;">--</span>';
                    }
                }
            }
            tbody += '</td>';
            // wakeup interval
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (!nodes[node_id].data.isListening.value && nodes[node_id].data.wakeup_interval != undefined && nodes[node_id].data.wakeup_interval.value != null) {
                    if (nodes[node_id].data.wakeup_interval.value == 0 || nodes[node_id].data.wakeup_interval.value > 86400) {
                        tbody += '<span class="label label-warning" style="font-size : 1em;">'
                    }
                    else {
                        tbody += '<span class="label label-info" style="font-size : 1em;">'
                    }
                    tbody += nodes[node_id].data.wakeup_interval.value + '</span>';
                }
            }
            tbody += '</td>';
            // statistics total
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.statistics != undefined && nodes[node_id].data.statistics.total > 0) {
                    tbody += '<span class="label label-primary" style="font-size : 1em;">' + nodes[node_id].data.statistics.total + '</span>';
                } else if (nodes[node_id].data.statistics != undefined && nodes[node_id].data.statistics.total != null) {
                    tbody += '<span class="label label-warning" style="font-size : 1em;">' + nodes[node_id].data.statistics.total + '</span>';
                }
            }
            tbody += '</td>';
            // statistics % ok
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.statistics != undefined && nodes[node_id].data.statistics.total > 0 && nodes[node_id].data.statistics.delivered != null) {
                    if (nodes[node_id].data.statistics.delivered > 90) {
                        tbody += '<span class="label label-success" style="font-size : 1em;">' + nodes[node_id].data.statistics.delivered + '%</span>';
                    } else if (nodes[node_id].data.statistics.delivered > 75) {
                        tbody += '<span class="label label-warning" style="font-size : 1em;">' + nodes[node_id].data.statistics.delivered + '%</span>';
                    } else {
                        tbody += '<span class="label label-danger" style="font-size : 1em;">' + nodes[node_id].data.statistics.delivered + '%</span>';
                    }
                }
            }
            tbody += '</td>';
            // statistics delivery time
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.statistics != undefined && nodes[node_id].data.statistics.total > 0 && nodes[node_id].data.statistics.deliveryTime != null) {
                    if (nodes[node_id].data.statistics.deliveryTime > 500) {
                        tbody += '<span class="label label-danger" style="font-size : 1em;">' + nodes[node_id].data.statistics.deliveryTime + 'ms</span>';
                    } else if (nodes[node_id].data.statistics.deliveryTime > 250) {
                        tbody += '<span class="label label-warning" style="font-size : 1em;">' + nodes[node_id].data.statistics.deliveryTime + 'ms</span>';
                    } else {
                        tbody += '<span class="label label-success" style="font-size : 1em;">' + nodes[node_id].data.statistics.deliveryTime + 'ms</span>';
                    }
                }
            }
            tbody += '</td>';
            // communication time
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                if (nodes[node_id].data.isListening.value) {
                    tbody += app_health.timestampConverter(nodes[node_id].data.lastReceived.updateTime, false);
                }
                else if (nodes[node_id].last_notification.description != undefined && nodes[node_id].data.lastReceived != undefined && nodes[node_id].data.lastReceived.updateTime != null) {
                    tbody += app_health.timestampConverter(nodes[node_id].data.lastReceived.updateTime, false);
                    if (nodes[node_id].data.wakeup_interval != undefined && nodes[node_id].data.wakeup_interval.next_wakeup != null) {
                        if (now > nodes[node_id].data.wakeup_interval.next_wakeup) {
                            tbody += ' <i class="fa fa-arrow-right text-danger"></i> <span class="label label-warning" style="font-size : 1em;" title="{{Le noeud ne s\'est pas réveillé comme prévue}}"> ' + app_health.timestampConverter(nodes[node_id].data.wakeup_interval.next_wakeup, true) + ' </span>';
                        }
                        else {
                            tbody += ' <i class="fa fa-arrow-right"></i> ' + app_health.timestampConverter(nodes[node_id].data.wakeup_interval.next_wakeup, true) + ' <i class="fa fa-clock-o"></i>';
                        }
                    }
                }
                else if (nodes[node_id].data.isListening.value == false && nodes[node_id].data.last_notification == undefined && nodes[node_id].data.wakeup_interval != undefined && nodes[node_id].data.wakeup_interval.value != null && nodes[node_id].data.lastReceived != undefined && nodes[node_id].data.lastReceived.updateTime != null) {
                    if (now > nodes[node_id].data.lastReceived.updateTime + nodes[node_id].data.wakeup_interval.value && nodes[node_id].data.wakeup_interval.value >0) {
                        tbody += '<span class="label label" style="font-size : 1.5em;" title="{{Le noeud ne s\'est pas encore réveillé une fois depuis le lancement du démon}}"><i class="fa fa-exclamation-circle text-danger"></i></span>';
                    }
                }
            }
            tbody += '</td>';
            // ping cmd
            tbody += '<td>';
            if (nodes[node_id].data.isEnable.value) {
                tbody += '<a class="btn btn-info btn-xs bt_pingDevice" data-id="' + node_id + '"><i class="fa fa-eye"></i> {{Ping}}</a>';
            }
            tbody += '</td>';
            tbody += '</tr>';
        }
        $('#table_healthNetwork tbody').empty().append(tbody);
    },
    update: function () {

    },
    sendOk: function () {
        $('#span_state').show();
        setTimeout(function () {
            $('#span_state').hide();
        }, 3000);
    },
    show: function () {

    },

}
