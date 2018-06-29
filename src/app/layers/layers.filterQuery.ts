import * as knex from 'knex';

export class KnexFilterQueryBuilder {
    public knex: any;
    constructor() {
        this.knex = knex({
            client: 'pg',
        })
    }

    spatialFilter = (knexQueryFunction, spatialFilter) => {
        let spatialFiterQueryString = '';
        if (spatialFilter.type === 'circle') {
            spatialFiterQueryString = `ST_intersects(ST_Buffer(ST_GeographyFromText('POINT(${spatialFilter.geometry.point})'), ${spatialFilter.geometry.radius}), parcels.geometry)`;
        } else if (spatialFilter.type === 'bounds') {
            spatialFiterQueryString = `ST_intersects(ST_GeographyFromText('POLYGON((${spatialFilter.geometry.replace('+', ' ')}))'), parcels.geometry)`;
        }
        knexQueryFunction.whereRaw(spatialFiterQueryString);

        return knexQueryFunction;
    }

    squareFilter = (knexQueryFunction, survey, segmented, squareFrom, squareTo, squareUnit) => {

        let sqUC;
        if (!squareUnit || squareUnit === 'ga') {
            sqUC = 10000;
        } else if (squareUnit === 'm') {
            sqUC = 1
        } else {
            sqUC = 1000000;
        }

        if (squareFrom && !squareTo) {
            segmented ?
                knexQueryFunction.andWhereRaw('(area_value >= ? OR segmentation_avaliable = ?)', [`${squareFrom * sqUC}`, true]) :
                knexQueryFunction.andWhereRaw('(area_value >= ?)', [`${squareFrom * sqUC}`]);
        } else if (!squareFrom && squareTo) {
            if (!survey) {
                segmented ?
                    knexQueryFunction.andWhereRaw('(area_value <= ? OR segmentation_avaliable = ?)', [`${squareTo * sqUC}`, true]) :
                    knexQueryFunction.andWhereRaw('(area_value  <= ? )', [`${squareTo * sqUC}`]);
            } else {
                segmented ?
                    knexQueryFunction.andWhereRaw(`(area_value <= ? OR area_value > ? AND survey_avaliable = ? OR segmentation_avaliable = ?)`, [`${squareTo * sqUC}`, `${squareTo * sqUC}`, true, true]) :
                    knexQueryFunction.andWhereRaw(`(area_value <= ? OR area_value > ? AND survey_avaliable = ?)`, [`${squareTo * sqUC}`, `${squareTo * sqUC}`, true]);
            }
        } else if (squareFrom && squareTo) {
            if (!survey) {
                segmented ?
                    knexQueryFunction.andWhereRaw(`(area_value BETWEEN ? AND ? OR segmentation_avaliable = ?)`, [`${squareFrom * sqUC}`, `${squareTo * sqUC}`, true]) :
                    knexQueryFunction.andWhereRaw(`(area_value BETWEEN ? AND ? )`, [`${squareFrom * sqUC}`, `${squareTo * sqUC}`]);
            } else {
                segmented ?
                    knexQueryFunction.andWhereRaw(`(area_value BETWEEN ? AND ?  OR area_value > ? AND survey_avaliable = ? OR segmentation_avaliable = ?)`, [`${squareFrom * sqUC}`, `${squareTo * sqUC}`, `${squareTo * sqUC}`, true, true]) :
                    knexQueryFunction.andWhereRaw(`(area_value BETWEEN ? AND ?  OR area_value > ? AND survey_avaliable = ?)`, [`${squareFrom * sqUC}`, `${squareTo * sqUC}`, `${squareTo * sqUC}`, true]);
            }
        }
        return knexQueryFunction;
    }

    distanceFilter = (knexQueryFunction, distanceFrom, distanceTo) => {
        let remotenessString = false;
        if (distanceFrom && !distanceTo) {
            knexQueryFunction.andWhere('mcad_remoteness', '>=', distanceFrom);
        } else if (!distanceFrom && distanceTo) {
            knexQueryFunction.andWhere('mcad_remoteness', '<=', distanceTo);
        } else if (distanceFrom && distanceTo) {
            knexQueryFunction.andWhereBetween('mcad_remoteness', [distanceFrom, distanceTo]);
        }
        return knexQueryFunction;
    }


    sideFilter = (knexQueryFunction, sideFilters) => {
        for (let index = 0; index < sideFilters.length; index++) {
            this._onColumnTypeDistribution(knexQueryFunction, sideFilters[index]);
        }
        return knexQueryFunction;
    }

    _onColumnTypeDistribution = (knexQueryFunction, sideFilter) => {
        if (sideFilter.column.columnType === 'findSimple') {
            this.findSimpleSideFilter(knexQueryFunction, sideFilter);
        }
        if (sideFilter.column.columnType === 'findBoolean') {
            this.findBooleanSideFilter(knexQueryFunction, sideFilter);
        }

        if (sideFilter.column.columnType === 'findMany') {
            this.findManySideFilter(knexQueryFunction, sideFilter);
        }

        if (sideFilter.column.columnType === 'findNumber') {
            this.findNumberSideFilter(knexQueryFunction, sideFilter)
        }

        if (sideFilter.column.columnType === 'findOne') {
            this.findOneSideFilter(knexQueryFunction, sideFilter)
        }

        if (sideFilter.column.columnType === 'findDate') {
            this.findDateSideFilter(knexQueryFunction, sideFilter)
        }

        if (sideFilter.column.columnType === 'findUser') {
            this.findUserSideFilter(knexQueryFunction, sideFilter)
        }

        return knexQueryFunction;
    }


    findSimpleSideFilter = (knexQueryFunction, sideFilter) => {
        let tblClmn = `${sideFilter.column.tableName}.${sideFilter.column.columnName}`;

        if (sideFilter.values.values) {
            let listSearchQueries = sideFilter.values.values
                .split(' ')
                .filter(item => (item && item.length) ? item : false)
                .map(item => { item.toLowerCase(); return `%${item}%` });

            if (listSearchQueries.length === 1) {
                let raw = `LOWER(${tblClmn}) like  ? `;
                if (sideFilter.values.noop) {
                    raw = `(${raw} OR ${tblClmn} IS NULL)`;
                    knexQueryFunction.andWhereRaw(raw, listSearchQueries);
                } else {
                    knexQueryFunction.andWhereRaw(`LOWER(${tblClmn}) like ?`, listSearchQueries);
                }
            } else if (listSearchQueries.length > 1) {
                let raw = '';
                for (let i = 0; i < listSearchQueries.length; i++) {
                    if (i === 0) {
                        raw += `(( LOWER(${tblClmn}) like  ? `;
                    } else if (i === (listSearchQueries.length - 1)) {
                        if (sideFilter.values.noop) {
                            raw += ` OR LOWER(${tblClmn}) like ? ) OR ${tblClmn} IS NULL)`;
                        } else {
                            raw += ` OR LOWER(${tblClmn}) like ? ))`;
                        }
                    } else {
                        raw += ` OR LOWER(${tblClmn}) like  ? `;
                    }
                }
                knexQueryFunction.andWhereRaw(raw, listSearchQueries);
            }
        } else {
            if (sideFilter.values.noop) knexQueryFunction.whereNull(`${tblClmn}`);
        }
        return knexQueryFunction;
    }

    findBooleanSideFilter = (knexQueryFunction, sideFilter) => {
        if (sideFilter.values.values.yes && sideFilter.values.values.no) {
            knexQueryFunction.andWhere(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, true)
                .orWhere(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, false);
        } else {
            if (sideFilter.values.values.yes) knexQueryFunction.andWhere(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, true);
            if (sideFilter.values.values.no) knexQueryFunction.andWhere(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, false);
        }

        if (sideFilter.values.noop) knexQueryFunction.orWhereNull(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`);
        return knexQueryFunction;
    }


    findManySideFilter = (knexQueryFunction, sideFilter) => {
        let listSearchQueries = [];

        let whereRaw = '';
        if (sideFilter.values && sideFilter.values.values) {
            for (let i = 0; i < sideFilter.values.values.length; i++) {
                (sideFilter.values.values.length > 1) ?
                    (i !== sideFilter.values.values.length - 1) ?
                        (i === 0) ?
                            whereRaw = ' where code = ? OR ' : whereRaw += ' code = ? OR ' : whereRaw += ' code = ? ' : whereRaw = ' where code = ? ';
                listSearchQueries.push(sideFilter.values.values[i].code);
            }
        }

        let ISNOTNULL = sideFilter.values.noop ? `t1${sideFilter.column.foreignTable}.feature_id IS NULL` : `t1${sideFilter.column.foreignTable}.feature_id IS NOT NULL`;

        knexQueryFunction.joinRaw(`left Join (SELECT DISTINCT ${sideFilter.column.foreignTable}.feature_id FROM geo.${sideFilter.column.foreignTable} ${whereRaw} ) AS t1${sideFilter.column.foreignTable} ON parcels.id = t1${sideFilter.column.foreignTable}.feature_id WHERE ${ISNOTNULL} `, listSearchQueries);

        return knexQueryFunction;
    }

    findNumberSideFilter = (knexQueryFunction, sideFilter) => {
        if (sideFilter.values.values.from >= 0 && sideFilter.values.values.from !== undefined && sideFilter.values.values.from !== null && sideFilter.values.values.to >= 0 && sideFilter.values.values.to !== undefined && sideFilter.values.values.to !== null) {
            knexQueryFunction.whereBetween(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, [sideFilter.values.values.from, sideFilter.values.values.to]);
        } else {
            if (sideFilter.values.values.from >= 0 && sideFilter.values.values.from !== undefined && sideFilter.values.values.from !== null)
                knexQueryFunction.where(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, '>=', sideFilter.values.values.from);

            if (sideFilter.values.values.to >= 0 && sideFilter.values.values.to !== undefined && sideFilter.values.values.to !== null)
                knexQueryFunction.where(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, '<=', sideFilter.values.values.to);
        }

        if (sideFilter.values.noop) knexQueryFunction.orWhereNull(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`);
        return knexQueryFunction;
    }

    findOneSideFilter = (knexQueryFunction, sideFilter) => {
        if (sideFilter && sideFilter.values && sideFilter.values.values && sideFilter.values.values.code) {
            knexQueryFunction.andWhere(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, `=`, `${sideFilter.values.values.code}`);
        }
        if (sideFilter.values.noop) knexQueryFunction.orWhereNull(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`);
        return knexQueryFunction;
    }

    findUserSideFilter = (knexQueryFunction, sideFilter) => {
        if (sideFilter && sideFilter.values && sideFilter.values.values && sideFilter.values.values) {
            knexQueryFunction.andWhere(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`, `=`, `${sideFilter.values.values.id}`);
        }
        if (sideFilter.values.noop) knexQueryFunction.orWhereNull(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`);
        return knexQueryFunction;
    }


    findDateSideFilter = (knexQueryFunction, sideFilter) => {
        if (sideFilter.values.values.from >= 0 && sideFilter.values.values.from !== undefined && sideFilter.values.values.from !== null && sideFilter.values.values.to >= 0 && sideFilter.values.values.to !== undefined && sideFilter.values.values.to !== null) {
            knexQueryFunction.andWhereRaw(`${sideFilter.column.tableName}.${sideFilter.column.columnName}::BIGINT  BETWEEN ?::BIGINT AND ?::BIGINT  `, [sideFilter.values.values.from, sideFilter.values.values.to]);
        } else {
            if (sideFilter.values.values.from >= 0 && sideFilter.values.values.from !== undefined && sideFilter.values.values.from !== null)
                knexQueryFunction.andWhereRaw(`${sideFilter.column.tableName}.${sideFilter.column.columnName}::BIGINT  >= ?::BIGINT `, [sideFilter.values.values.from]);

            if (sideFilter.values.values.to >= 0 && sideFilter.values.values.to !== undefined && sideFilter.values.values.to !== null)
                knexQueryFunction.andWhereRaw(`${sideFilter.column.tableName}.${sideFilter.column.columnName}::BIGINT  <= ?::BIGINT `, [sideFilter.values.values.to]);

        }
        if (sideFilter.values.noop) knexQueryFunction.orWhereNull(`${sideFilter.column.tableName}.${sideFilter.column.columnName}`);
        return knexQueryFunction;
    }
}